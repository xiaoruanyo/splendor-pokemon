import type {
  GameState, PlayerState, BoardState, PokemonCard, TokenColor, CardLevel,
  Evolution,
} from './types.js';
import { MASTER_BALL_TOTAL, TOKEN_COUNT_BY_PLAYERS, WIN_SCORE, ALL_COLORS } from './types.js';
import { shuffle, generateCardId } from './cards.js';
import { getAvailableEvolutions, executeEvolution } from './evolution.js';
import { createAllCards } from './cards.js';

export interface ActionResult {
  success: boolean;
  message?: string;
}

// Create initial game state
export function createGameState(
  gameId: string,
  players: { id: string; name: string; avatar: string; userId?: string }[]
): GameState {
  const playerCount = players.length;
  const tokenCount = TOKEN_COUNT_BY_PLAYERS[playerCount] || 7;

  const playerStates: PlayerState[] = players.map(p => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    userId: p.userId,
    tokens: { red: 0, blue: 0, black: 0, pink: 0, yellow: 0, purple: 0 },
    ownedCards: [],
    reservedCards: [],
    score: 0,
    evolutionCount: 0,
    bonuses: { red: 0, blue: 0, black: 0, pink: 0, yellow: 0, purple: 0 },
    isConnected: true,
  }));

  const allCards = createAllCards();
  const decks: Record<CardLevel, PokemonCard[]> = {
    1: shuffle(allCards.filter(c => c.level === 1)),
    2: shuffle(allCards.filter(c => c.level === 2)),
    3: shuffle(allCards.filter(c => c.level === 3)),
    rare: shuffle(allCards.filter(c => c.level === 'rare')),
    legendary: shuffle(allCards.filter(c => c.level === 'legendary')),
  };

  const revealed: Record<CardLevel, PokemonCard[]> = {
    1: decks[1].splice(0, 4),
    2: decks[2].splice(0, 4),
    3: decks[3].splice(0, 4),
    rare: [],
    legendary: [],
  };
  const rareRevealed = decks.rare.shift() || null;
  const legendaryRevealed = decks.legendary.shift() || null;

  const board: BoardState = { decks, revealed, rareRevealed, legendaryRevealed };

  const tokenSupply: Record<TokenColor, number> = {
    red: tokenCount, blue: tokenCount, black: tokenCount,
    pink: tokenCount, yellow: tokenCount, purple: MASTER_BALL_TOTAL,
  };

  const firstPlayer = Math.floor(Math.random() * playerCount);

  return {
    gameId,
    players: playerStates,
    board,
    tokenSupply,
    currentPlayerIndex: firstPlayer,
    phase: 'playing',
    turnNumber: 1,
    lastRoundTriggered: false,
    lastRoundStartPlayer: -1,
    winner: null,
    rankings: [],
  };
}

// Take 3 different tokens
export function take3Diff(game: GameState, playerId: string, tokens: TokenColor[]): ActionResult {
  const player = game.players.find(p => p.id === playerId)!;
  for (const color of tokens) {
    game.tokenSupply[color]--;
    player.tokens[color] = (player.tokens[color] || 0) + 1;
  }
  return { success: true, message: `拿取了 ${tokens.length} 枚精灵球` };
}

// Take 2 same tokens
export function take2Same(game: GameState, playerId: string, color: TokenColor): ActionResult {
  const player = game.players.find(p => p.id === playerId)!;
  game.tokenSupply[color] -= 2;
  player.tokens[color] = (player.tokens[color] || 0) + 2;
  return { success: true, message: `拿取了2枚精灵球` };
}

// Buy a card
export function buyCard(
  game: GameState, playerId: string, cardId: string,
  source: 'board' | 'reserved', payment: Record<string, number>
): ActionResult {
  const player = game.players.find(p => p.id === playerId)!;

  let card: PokemonCard | undefined;
  if (source === 'board') {
    for (const level of [1, 2, 3] as const) {
      card = (game.board.revealed[level] || []).find(c => c.id === cardId);
      if (card) break;
    }
    if (!card && game.board.rareRevealed?.id === cardId) card = game.board.rareRevealed;
    if (!card && game.board.legendaryRevealed?.id === cardId) card = game.board.legendaryRevealed;
  } else {
    card = player.reservedCards.find(c => c.id === cardId);
  }
  if (!card) return { success: false, message: '找不到该卡牌' };

  // Deduct tokens
  for (const color of ALL_COLORS) {
    if (payment[color]) {
      player.tokens[color] -= payment[color];
      game.tokenSupply[color] += payment[color];
    }
  }

  // Remove card
  if (source === 'board') {
    for (const level of [1, 2, 3] as const) {
      const idx = (game.board.revealed[level] || []).findIndex(c => c.id === cardId);
      if (idx !== -1) { game.board.revealed[level]!.splice(idx, 1); break; }
    }
    if (game.board.rareRevealed?.id === cardId) game.board.rareRevealed = null;
    if (game.board.legendaryRevealed?.id === cardId) game.board.legendaryRevealed = null;
  } else {
    player.reservedCards = player.reservedCards.filter(c => c.id !== cardId);
  }

  player.ownedCards.push(card);
  player.bonuses[card.bonus] = (player.bonuses[card.bonus] || 0) + card.bonusCount;
  player.score += card.points;

  return { success: true, message: `捕获了 ${card.name}！` };
}

// Reserve a card
export function reserveCard(
  game: GameState, playerId: string, source: 'board' | 'deck',
  cardId?: string, level?: CardLevel
): ActionResult {
  const player = game.players.find(p => p.id === playerId)!;
  let card: PokemonCard;

  if (source === 'board' && cardId) {
    card = findAndRemoveFromBoard(game, cardId)!;
    if (!card) return { success: false, message: '找不到该卡牌' };
  } else {
    const deck = game.board.decks[level!];
    card = { ...deck.pop()!, id: generateCardId() };
  }

  player.reservedCards.push(card);
  game.tokenSupply.purple--;
  player.tokens.purple = (player.tokens.purple || 0) + 1;

  return { success: true, message: `保留了 ${card.name} 并获得1枚大师球` };
}

function findAndRemoveFromBoard(game: GameState, cardId: string): PokemonCard | null {
  for (const level of [1, 2, 3] as const) {
    const idx = (game.board.revealed[level] || []).findIndex(c => c.id === cardId);
    if (idx !== -1) return game.board.revealed[level]!.splice(idx, 1)[0];
  }
  if (game.board.rareRevealed?.id === cardId) { const c = game.board.rareRevealed; game.board.rareRevealed = null; return c; }
  if (game.board.legendaryRevealed?.id === cardId) { const c = game.board.legendaryRevealed; game.board.legendaryRevealed = null; return c; }
  return null;
}

// Evolve
export function evolve(game: GameState, playerId: string, fromId: string, toId: string): ActionResult {
  const player = game.players.find(p => p.id === playerId)!;
  const evos = getAvailableEvolutions(player, game.board);
  const evo = evos.find(e => e.from.id === fromId && e.to.id === toId);
  if (!evo) return { success: false, message: '无法执行此进化' };
  const result = executeEvolution(player, evo, game.board);
  return result;
}

// Fill empty board slots
export function fillBoardSlots(game: GameState): void {
  for (const level of [1, 2, 3] as const) {
    while ((game.board.revealed[level] || []).length < 4 && game.board.decks[level].length > 0) {
      game.board.revealed[level]!.push(game.board.decks[level].shift()!);
    }
  }
  if (!game.board.rareRevealed && game.board.decks.rare.length > 0) {
    game.board.rareRevealed = game.board.decks.rare.shift()!;
  }
  if (!game.board.legendaryRevealed && game.board.decks.legendary.length > 0) {
    game.board.legendaryRevealed = game.board.decks.legendary.shift()!;
  }
}

// End turn, returns whether game is over
export function endTurn(game: GameState): { gameOver: boolean } {
  if (!game.lastRoundTriggered) {
    const hasWinner = game.players.some(p => p.score >= WIN_SCORE);
    if (hasWinner) {
      game.lastRoundTriggered = true;
      game.lastRoundStartPlayer = game.currentPlayerIndex;
    }
  }

  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
  game.turnNumber++;

  if (game.lastRoundTriggered && game.currentPlayerIndex === game.lastRoundStartPlayer) {
    return finalizeGame(game);
  }
  return { gameOver: false };
}

function finalizeGame(game: GameState): { gameOver: boolean } {
  game.phase = 'finished';
  game.rankings = [...game.players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.evolutionCount - a.evolutionCount;
  });
  game.winner = game.rankings[0];
  return { gameOver: true };
}

// Get current player
export function getCurrentPlayer(game: GameState): PlayerState {
  return game.players[game.currentPlayerIndex];
}
