import { create } from 'zustand';
import type {
  GameState, GameMode, AIDifficulty, TokenColor, CardLevel,
  Evolution, PokemonCard,
} from '../types/game';
import { MAX_RESERVED } from '../types/game';
import {
  createInitialState, take3Diff, take2Same, buyCard, reserveCard,
  evolve, fillBoardSlots, endTurn, getCurrentPlayer,
} from '../engine/game';
import {
  validateTake3Diff, validateTake2Same, validateBuyCard,
} from '../engine/validator';
import { getAvailableEvolutions } from '../engine/evolution';
import { getAIAction, getAIEvolution } from '../ai/aiPlayer';
import { calculatePayment, canAfford } from '../engine/cards';

interface GameStore {
  // State
  game: GameState | null;
  selectedTokens: TokenColor[];
  selectedCard: string | null;
  actionMode: 'none' | 'take_3' | 'take_2' | 'buy' | 'reserve' | 'evolve_select';
  evolutionOptions: Evolution[];
  evolutionTarget: Evolution | null;
  message: string | null;
  messageType: 'info' | 'success' | 'error';
  isAIThinking: boolean;
  gameOver: boolean;

  // Setup
  startGame: (mode: GameMode, playerConfigs: {
    name: string; trainer: string; trainerEmoji: string; isAI: boolean; aiDifficulty?: AIDifficulty;
  }[]) => void;

  // Selection
  selectToken: (color: TokenColor) => void;
  deselectToken: (color: TokenColor) => void;
  selectCard: (cardId: string | null) => void;
  setActionMode: (mode: GameStore['actionMode']) => void;
  clearSelection: () => void;

  // Actions
  executeTake3Diff: () => void;
  executeTake2Same: (color: TokenColor) => void;
  executeBuyCard: (cardId: string, source: 'board' | 'reserved') => void;
  executeReserve: (source: 'board' | 'deck', cardId?: string, level?: CardLevel) => void;
  executeEvolve: (fromId: string, toId: string) => void;
  executePass: () => void;

  // AI
  triggerAITurn: () => Promise<void>;

  // Helpers
  checkEvolutions: () => Evolution[];
  getBuyableCards: () => PokemonCard[];
  getAffordableCards: () => PokemonCard[];
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  selectedTokens: [],
  selectedCard: null,
  actionMode: 'none',
  evolutionOptions: [],
  evolutionTarget: null,
  message: null,
  messageType: 'info',
  isAIThinking: false,
  gameOver: false,

  startGame: (mode, playerConfigs) => {
    const game = createInitialState(mode, playerConfigs);
    set({
      game,
      selectedTokens: [],
      selectedCard: null,
      actionMode: 'none',
      evolutionOptions: [],
      evolutionTarget: null,
      message: `游戏开始！轮到 ${game.players[game.currentPlayerIndex].name}`,
      messageType: 'info',
      isAIThinking: false,
      gameOver: false,
    });
  },

  selectToken: (color) => {
    const { selectedTokens, actionMode } = get();
    if (actionMode === 'take_3') {
      if (selectedTokens.includes(color)) return;
      if (selectedTokens.length >= 3) return;
      set({ selectedTokens: [...selectedTokens, color] });
    }
  },

  deselectToken: (color) => {
    set({ selectedTokens: get().selectedTokens.filter(t => t !== color) });
  },

  selectCard: (cardId) => set({ selectedCard: cardId }),
  setActionMode: (mode) => set({ actionMode: mode, selectedTokens: [], selectedCard: null }),
  clearSelection: () => set({
    selectedTokens: [],
    selectedCard: null,
    actionMode: 'none',
    evolutionOptions: [],
    evolutionTarget: null,
  }),

  executeTake3Diff: () => {
    const { game, selectedTokens } = get();
    if (!game) return;
    const player = getCurrentPlayer(game);
    const err = validateTake3Diff(game, player, selectedTokens);
    if (err) { set({ message: err, messageType: 'error' }); return; }

    const result = take3Diff(game, player.id, selectedTokens);
    get().clearSelection();
    fillBoardSlots(game);
    const endResult = endTurn(game);
    set({
      game: { ...game },
      message: result.message || '拿取了精灵球',
      messageType: 'success',
      gameOver: endResult.gameOver,
    });
  },

  executeTake2Same: (color) => {
    const { game } = get();
    if (!game) return;
    const player = getCurrentPlayer(game);
    const err = validateTake2Same(game, player, color);
    if (err) { set({ message: err, messageType: 'error' }); return; }

    const result = take2Same(game, player.id, color);
    get().clearSelection();
    fillBoardSlots(game);
    const endResult = endTurn(game);
    set({
      game: { ...game },
      message: result.message || '拿取了精灵球',
      messageType: 'success',
      gameOver: endResult.gameOver,
    });
  },

  executeBuyCard: (cardId, source) => {
    const { game } = get();
    if (!game) return;
    const player = getCurrentPlayer(game);

    // Find the card
    let card: PokemonCard | undefined;
    if (source === 'board') {
      for (const level of [1, 2, 3] as const) {
        card = (game.board.revealed[level] || []).find((c: PokemonCard) => c.id === cardId);
        if (card) break;
      }
      if (!card && game.board.rareRevealed?.id === cardId) card = game.board.rareRevealed;
      if (!card && game.board.legendaryRevealed?.id === cardId) card = game.board.legendaryRevealed;
    } else {
      card = player.reservedCards.find((c: PokemonCard) => c.id === cardId);
    }
    if (!card) { set({ message: '找不到卡牌', messageType: 'error' }); return; }

    const payment = calculatePayment(card, player.tokens, player.bonuses);
    if (!payment) { set({ message: '无法支付费用', messageType: 'error' }); return; }

    const err = validateBuyCard(game, player, card, payment, source);
    if (err) { set({ message: err, messageType: 'error' }); return; }

    const result = buyCard(game, player.id, cardId, source, payment);
    if (!result.success) { set({ message: result.message, messageType: 'error' }); return; }

    get().clearSelection();
    fillBoardSlots(game);

    // Check evolutions after buying
    const evos = getAvailableEvolutions(player, game.board);
    if (evos.length > 0) {
      set({
        game: { ...game },
        evolutionOptions: evos,
        message: result.message + ' 你可以进化宝可梦！',
        messageType: 'success',
      });
    } else {
      const endResult = endTurn(game);
      set({
        game: { ...game },
        message: result.message || '捕获成功',
        messageType: 'success',
        gameOver: endResult.gameOver,
      });
    }
  },

  executeReserve: (source, cardId, level) => {
    const { game } = get();
    if (!game) return;
    const player = getCurrentPlayer(game);

    if (source === 'board' && cardId) {
      if (player.reservedCards.length >= MAX_RESERVED) {
        set({ message: '保留区已满', messageType: 'error' }); return;
      }
      if (game.tokenSupply.purple <= 0) {
        set({ message: '大师球已耗尽', messageType: 'error' }); return;
      }
    } else if (source === 'deck' && level) {
      if (player.reservedCards.length >= MAX_RESERVED) {
        set({ message: '保留区已满', messageType: 'error' }); return;
      }
      if (game.tokenSupply.purple <= 0) {
        set({ message: '大师球已耗尽', messageType: 'error' }); return;
      }
      if (game.board.decks[level].length === 0) {
        set({ message: '该牌堆已空', messageType: 'error' }); return;
      }
    }

    const result = reserveCard(game, player.id, source, cardId, level);
    if (!result.success) { set({ message: result.message, messageType: 'error' }); return; }

    get().clearSelection();
    fillBoardSlots(game);
    const endResult = endTurn(game);
    set({
      game: { ...game },
      message: result.message || '保留了卡牌',
      messageType: 'success',
      gameOver: endResult.gameOver,
    });
  },

  executeEvolve: (fromId, toId) => {
    const { game } = get();
    if (!game) return;
    const player = getCurrentPlayer(game);

    const result = evolve(game, player.id, fromId, toId);
    if (!result.success) { set({ message: result.message, messageType: 'error' }); return; }

    get().clearSelection();
    fillBoardSlots(game);
    const endResult = endTurn(game);
    set({
      game: { ...game },
      message: result.message || '进化成功',
      messageType: 'success',
      gameOver: endResult.gameOver,
    });
  },

  executePass: () => {
    const { game } = get();
    if (!game) return;
    get().clearSelection();
    fillBoardSlots(game);
    const endResult = endTurn(game);
    set({
      game: { ...game },
      message: '跳过了进化',
      messageType: 'info',
      gameOver: endResult.gameOver,
    });
  },

  triggerAITurn: async () => {
    const { game } = get();
    if (!game || game.phase === 'finished') return;

    const player = getCurrentPlayer(game);
    if (!player.isAI) return;

    set({ isAIThinking: true });

    try {
      // First check if we're in evolution phase
      const evos = getAvailableEvolutions(player, game.board);
      if (evos.length > 0) {
        const evo = await getAIEvolution(evos);
        if (evo) {
          const result = evolve(game, player.id, evo.from.id, evo.to.id);
          if (result.success) {
            fillBoardSlots(game);
            set({ game: { ...game }, isAIThinking: false });
            // End turn after evolution
            const endResult = endTurn(game);
            set({
              game: { ...game },
              message: `${player.name} 进化了 ${evo.from.name} → ${evo.to.name}！`,
              messageType: 'info',
              gameOver: endResult.gameOver,
              isAIThinking: false,
            });
            return;
          }
        }
      }

      // Normal action
      const action = await getAIAction(game, player, player.aiDifficulty || 'easy');

      switch (action.type) {
        case 'take_3_diff': {
          const tokens = Object.entries(action.tokens || {}).filter(([, v]) => v === 1).map(([k]) => k as TokenColor);
          if (tokens.length > 0) {
            const err = validateTake3Diff(game, player, tokens);
            if (!err) take3Diff(game, player.id, tokens);
          }
          break;
        }
        case 'take_2_same': {
          const color = Object.keys(action.tokens || {})[0] as TokenColor;
          if (color) {
            const err = validateTake2Same(game, player, color);
            if (!err) take2Same(game, player.id, color);
          }
          break;
        }
        case 'buy_board':
        case 'buy_reserved':
          if (action.cardId && action.payment) {
            const source = action.type === 'buy_reserved' ? 'reserved' : 'board';
            let card: PokemonCard | undefined;
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
            if (card) {
              const payment = calculatePayment(card, player.tokens, player.bonuses);
              if (payment && !validateBuyCard(game, player, card, payment, source)) {
                buyCard(game, player.id, action.cardId, source, payment);
              }
            }
          }
          break;
        case 'reserve_board':
          if (action.cardId && game.tokenSupply.purple > 0 && player.reservedCards.length < 3) {
            reserveCard(game, player.id, 'board', action.cardId);
          }
          break;
        case 'reserve_deck':
          if (action.fromLevel && game.tokenSupply.purple > 0 && player.reservedCards.length < 3) {
            reserveCard(game, player.id, 'deck', undefined, action.fromLevel);
          }
          break;
        case 'evolve':
          if (action.evolveFrom && action.evolveTo) {
            evolve(game, player.id, action.evolveFrom, action.evolveTo);
          }
          break;
      }

      fillBoardSlots(game);

      // Check for new evolution opportunities after action (especially after buying)
      const newEvos = getAvailableEvolutions(player, game.board);
      if (newEvos.length > 0) {
        const bestEvo = newEvos.sort((a, b) => b.to.points - a.to.points)[0];
        const evoResult = evolve(game, player.id, bestEvo.from.id, bestEvo.to.id);
        if (evoResult.success) fillBoardSlots(game);
      }

      const endResult = endTurn(game);

      const actionNames: Record<string, string> = {
        take_3_diff: '拿取了精灵球',
        take_2_same: '拿取了精灵球',
        buy_board: '捕获了宝可梦',
        buy_reserved: '从保留区捕获了宝可梦',
        reserve_board: '保留了卡牌',
        reserve_deck: '从牌堆暗抽了卡牌',
        evolve: '进化了宝可梦',
        pass: '跳过',
      };

      set({
        game: { ...game },
        message: `${player.name} ${actionNames[action.type] || '完成了操作'}`,
        messageType: 'info',
        isAIThinking: false,
        gameOver: endResult.gameOver,
      });
    } catch (e) {
      set({ isAIThinking: false, message: 'AI操作出错', messageType: 'error' });
    }
  },

  checkEvolutions: () => {
    const { game } = get();
    if (!game) return [];
    const player = getCurrentPlayer(game);
    return getAvailableEvolutions(player, game.board);
  },

  getBuyableCards: () => {
    const { game } = get();
    if (!game) return [];
    const result: PokemonCard[] = [];
    for (const level of [1, 2, 3] as const) {
      result.push(...(game.board.revealed[level] || []));
    }
    if (game.board.rareRevealed) result.push(game.board.rareRevealed);
    if (game.board.legendaryRevealed) result.push(game.board.legendaryRevealed);
    return result;
  },

  getAffordableCards: () => {
    const { game } = get();
    if (!game) return [];
    const player = getCurrentPlayer(game);
    const result: PokemonCard[] = [];
    const cards = get().getBuyableCards();
    for (const card of cards) {
      const { affordable } = canAfford(card, player.tokens, player.bonuses);
      if (affordable) result.push(card);
    }
    for (const card of player.reservedCards) {
      const { affordable } = canAfford(card, player.tokens, player.bonuses);
      if (affordable) result.push(card);
    }
    return result;
  },
}));
