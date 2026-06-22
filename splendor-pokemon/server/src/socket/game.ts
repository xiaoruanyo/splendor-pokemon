import type { Server, Socket } from 'socket.io';
import { getRoomByPlayer, rooms } from './room.js';
import {
  createGameState, take3Diff, take2Same, buyCard, reserveCard,
  evolve, fillBoardSlots, endTurn, getCurrentPlayer,
} from '../engine/game.js';
import {
  validateTake3Diff, validateTake2Same, validateBuyCard, validateReserve,
} from '../engine/validator.js';
import { calculatePayment } from '../engine/cards.js';
import { getAvailableEvolutions } from '../engine/evolution.js';
import type { GameAction, TokenColor } from '../engine/types.js';
import type { GameState } from '../engine/types.js';
import prisma from '../db.js';

// Store game states
const gameStates = new Map<string, GameState>();

export function setGameState(roomId: string, game: GameState): void {
  gameStates.set(roomId, game);
}

export function registerGameHandlers(io: Server, socket: Socket): void {
  // Start game (host only)
  socket.on('game:start', (_data, callback) => {
    try {
      const room = getRoomByPlayer(socket.id);
      if (!room) { callback?.({ error: '不在房间中' }); return; }
      if (room.hostId !== socket.id) { callback?.({ error: '只有房主可以开始' }); return; }
      if (room.players.length < 2) { callback?.({ error: '至少需要2名玩家' }); return; }
      if (!room.players.every(p => p.ready)) { callback?.({ error: '有玩家未准备' }); return; }

      const game = createGameState(
        room.roomId,
        room.players.map(p => ({ id: p.socketId, name: p.name, avatar: p.avatar, userId: p.userId }))
      );

      room.status = 'playing';
      setGameState(room.roomId, game);

      io.to(room.roomId).emit('game:started', JSON.parse(JSON.stringify(game)));
      callback?.({ success: true });
    } catch (err: any) {
      callback?.({ error: err.message });
    }
  });

  // Submit game action
  socket.on('game:action', (action: GameAction, callback) => {
    try {
      const room = getRoomByPlayer(socket.id);
      if (!room || room.status !== 'playing') { callback?.({ error: '没有进行中的游戏' }); return; }

      const game = gameStates.get(room.roomId);
      if (!game) { callback?.({ error: '游戏状态不存在' }); return; }

      const player = game.players[game.currentPlayerIndex];
      if (player.id !== socket.id) { callback?.({ error: '还没轮到你' }); return; }

      let result: { success: boolean; message?: string } = { success: false, message: '未知操作' };

      switch (action.type) {
        case 'take_3_diff': {
          const tokens = Object.entries(action.tokens || {}).filter(([,v]) => v === 1).map(([k]) => k as TokenColor);
          const err = validateTake3Diff(game, player, tokens);
          if (err) { callback?.({ error: err }); return; }
          result = take3Diff(game, player.id, tokens);
          break;
        }
        case 'take_2_same': {
          const color = Object.keys(action.tokens || {})[0] as TokenColor;
          if (!color) { callback?.({ error: '请选择颜色' }); return; }
          const err = validateTake2Same(game, player, color);
          if (err) { callback?.({ error: err }); return; }
          result = take2Same(game, player.id, color);
          break;
        }
        case 'buy_board':
        case 'buy_reserved': {
          if (!action.cardId) { callback?.({ error: '请选择卡牌' }); return; }
          const source = action.type === 'buy_reserved' ? 'reserved' : 'board';
          let card = null;
          if (source === 'board') {
            for (const level of [1, 2, 3] as const) {
              card = (game.board.revealed[level] || []).find(c => c.id === action.cardId);
              if (card) break;
            }
            if (!card && game.board.rareRevealed?.id === action.cardId) card = game.board.rareRevealed;
            if (!card && game.board.legendaryRevealed?.id === action.cardId) card = game.board.legendaryRevealed;
          } else {
            card = player.reservedCards.find(c => c.id === action.cardId);
          }
          if (!card) { callback?.({ error: '找不到该卡牌' }); return; }

          const payment = calculatePayment(card, player.tokens, player.bonuses);
          if (!payment) { callback?.({ error: '无法支付' }); return; }
          const err = validateBuyCard(game, player, card, payment, source);
          if (err) { callback?.({ error: err }); return; }
          result = buyCard(game, player.id, action.cardId, source, payment);
          break;
        }
        case 'reserve_board': {
          if (!action.cardId) { callback?.({ error: '请选择卡牌' }); return; }
          const err = validateReserve(game, player, 'board');
          if (err) { callback?.({ error: err }); return; }
          result = reserveCard(game, player.id, 'board', action.cardId);
          break;
        }
        case 'reserve_deck': {
          if (!action.fromLevel) { callback?.({ error: '请选择牌堆' }); return; }
          const err = validateReserve(game, player, 'deck', undefined, action.fromLevel);
          if (err) { callback?.({ error: err }); return; }
          result = reserveCard(game, player.id, 'deck', undefined, action.fromLevel);
          break;
        }
        case 'evolve': {
          if (!action.evolveFrom || !action.evolveTo) { callback?.({ error: '请选择进化链' }); return; }
          result = evolve(game, player.id, action.evolveFrom, action.evolveTo);
          break;
        }
        case 'pass': {
          result = { success: true, message: '跳过' };
          break;
        }
      }

      if (!result.success) { callback?.({ error: result.message }); return; }

      fillBoardSlots(game);

      // Check evolutions
      const evos = getAvailableEvolutions(player, game.board);

      callback?.({ success: true, evolutionOptions: evos.length > 0 ? evos : [] });

      // If no evolutions or evolve/pass action, end turn
      if (evos.length === 0 || action.type === 'evolve' || action.type === 'pass') {
        const endResult = endTurn(game);
        io.to(room.roomId).emit('game:state_update', JSON.parse(JSON.stringify(game)));

        if (endResult.gameOver) {
          room.status = 'finished';
          io.to(room.roomId).emit('game:ended', JSON.parse(JSON.stringify({
            winner: game.winner,
            rankings: game.rankings,
          })));
          saveGameRecord(game, room.players).catch(console.error);
          gameStates.delete(room.roomId);
        }
      } else {
        // Broadcast state with evolution pending
        io.to(room.roomId).emit('game:state_update', JSON.parse(JSON.stringify(game)));
        socket.emit('game:evolution_available', evos);
      }
    } catch (err: any) {
      callback?.({ error: err.message });
    }
  });

  // Evolution pass
  socket.on('game:pass_evolution', (_data, callback) => {
    try {
      const room = getRoomByPlayer(socket.id);
      if (!room) { callback?.({ error: '不在房间中' }); return; }
      const game = gameStates.get(room.roomId);
      if (!game) { callback?.({ error: '游戏状态不存在' }); return; }

      const endResult = endTurn(game);
      io.to(room.roomId).emit('game:state_update', JSON.parse(JSON.stringify(game)));

      if (endResult.gameOver) {
        room.status = 'finished';
        io.to(room.roomId).emit('game:ended', JSON.parse(JSON.stringify({
          winner: game.winner,
          rankings: game.rankings,
        })));
        saveGameRecord(game, room.players).catch(console.error);
        gameStates.delete(room.roomId);
      }

      callback?.({ success: true });
    } catch (err: any) {
      callback?.({ error: err.message });
    }
  });
}

// Save game record to database
async function saveGameRecord(game: GameState, players: any[]): Promise<void> {
  try {
    const finalScores = game.rankings.map((p, i) => ({
      playerId: p.id,
      name: p.name,
      userId: p.userId,
      score: p.score,
      evolutionCount: p.evolutionCount,
      rank: i + 1,
    }));

    const winnerId = game.winner?.userId || null;

    await prisma.gameRecord.create({
      data: {
        mode: 'online',
        playerCount: game.players.length,
        winnerId,
        finalScores: JSON.stringify(finalScores),
        players: {
          create: finalScores.map(s => ({
            userId: s.userId || s.playerId,
            score: s.score,
            rank: s.rank,
          })),
        },
      },
    });

    for (const p of finalScores) {
      const userId = p.userId;
      if (!userId) continue;
      const stats = await prisma.userStats.findUnique({ where: { userId } });
      if (!stats) continue;
      const isWin = p.rank === 1;
      const newTotal = stats.totalGames + 1;
      const newWins = stats.wins + (isWin ? 1 : 0);
      const newLosses = stats.losses + (isWin ? 0 : 1);
      const newAvg = ((stats.avgScore * stats.totalGames) + p.score) / newTotal;
      const newHighest = Math.max(stats.highestScore, p.score);
      const eloChange = isWin ? 15 : -10;
      const newElo = Math.max(0, stats.ratingElo + eloChange);

      await prisma.userStats.update({
        where: { userId },
        data: { totalGames: newTotal, wins: newWins, losses: newLosses, avgScore: Math.round(newAvg * 100) / 100, highestScore: newHighest, ratingElo: newElo },
      });
    }
  } catch (err) {
    console.error('Failed to save game record:', err);
  }
}
