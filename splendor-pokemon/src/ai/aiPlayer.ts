import type { GameState, PlayerState, GameAction, PokemonCard, Evolution } from '../types/game';
import { TOKEN_COLORS } from '../types/game';
import { canAfford, calculatePayment } from '../engine/cards';
import { getAvailableEvolutions } from '../engine/evolution';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getAIAction(game: GameState, player: PlayerState, difficulty: 'easy' | 'medium'): Promise<GameAction> {
  // Simulate thinking time
  await delay(500 + Math.random() * 1000);

  if (difficulty === 'easy') {
    return easyAI(game, player);
  } else {
    return mediumAI(game, player);
  }
}

function easyAI(game: GameState, player: PlayerState): GameAction {
  // 1. Evolution check (70% chance if available)
  const evos = getAvailableEvolutions(player, game.board);
  if (evos.length > 0 && Math.random() < 0.7) {
    const evo = evos[Math.floor(Math.random() * evos.length)];
    return {
      type: 'evolve',
      playerId: player.id,
      evolveFrom: evo.from.id,
      evolveTo: evo.to.id,
    };
  }

  const roll = Math.random();

  // 2. Buy if affordable (35%)
  if (roll < 0.35) {
    const affordable = findAffordableCards(game, player);
    if (affordable.length > 0) {
      const card = affordable[Math.floor(Math.random() * affordable.length)];
      const payment = calculatePayment(card, player.tokens, player.bonuses);
      if (payment) {
        return {
          type: 'buy_board',
          playerId: player.id,
          cardId: card.id,
          source: 'board',
          payment,
        };
      }
    }
  }

  // 3. Reserve (20%)
  if (roll < 0.55 && player.reservedCards.length < 3 && game.tokenSupply.purple > 0) {
    // Target high-point cards
    const allVisible = getAllVisibleCards(game);
    if (allVisible.length > 0) {
      const sorted = [...allVisible].sort((a, b) => b.points - a.points);
      return {
        type: 'reserve_board',
        playerId: player.id,
        cardId: sorted[0].id,
        source: 'board',
      };
    }
  }

  // 4. Take tokens (default)
  return smartTakeTokens(game, player);
}

function mediumAI(game: GameState, player: PlayerState): GameAction {
  // 1. Evolution always if available
  const evos = getAvailableEvolutions(player, game.board);
  if (evos.length > 0) {
    // Choose highest point evolution
    const best = evos.sort((a, b) => b.to.points - a.to.points)[0];
    return {
      type: 'evolve',
      playerId: player.id,
      evolveFrom: best.from.id,
      evolveTo: best.to.id,
    };
  }

  // 2. Buy the best card we can afford
  const affordable = findAffordableCards(game, player);
  if (affordable.length > 0) {
    // Score cards by value: points * 3 + bonus usefulness
    const scored = affordable.map(card => ({
      card,
      score: card.points * 3 + (card.bonusCount > 1 ? 3 : 1) + (card.evolutionOf ? 1 : 0),
    }));
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0].card;
    const payment = calculatePayment(best, player.tokens, player.bonuses);
    if (payment) {
      return {
        type: 'buy_board',
        playerId: player.id,
        cardId: best.id,
        source: 'board',
        payment,
      };
    }
  }

  // 3. Reserve a card that's close to affordable
  if (player.reservedCards.length < 3 && game.tokenSupply.purple > 0) {
    const allVisible = getAllVisibleCards(game);
    // Find cards we're closest to affording
    const scored = allVisible.map(card => {
      const { shortage } = canAfford(card, player.tokens, player.bonuses);
      return { card, shortage, value: card.points * 2 - shortage };
    });
    scored.sort((a, b) => b.value - a.value);

    // Reserve if it's worth it (high value and close to affordable)
    if (scored.length > 0 && scored[0].value > 0) {
      return {
        type: 'reserve_board',
        playerId: player.id,
        cardId: scored[0].card.id,
        source: 'board',
      };
    }
  }

  // 4. Strategic token taking: aim for the most desired card
  return smartTakeTokens(game, player);
}

function findAffordableCards(game: GameState, player: PlayerState): PokemonCard[] {
  const result: PokemonCard[] = [];
  const allVisible = getAllVisibleCards(game);

  for (const card of allVisible) {
    const { affordable } = canAfford(card, player.tokens, player.bonuses);
    if (affordable) result.push(card);
  }

  // Also check reserved
  for (const card of player.reservedCards) {
    const { affordable } = canAfford(card, player.tokens, player.bonuses);
    if (affordable) result.push(card);
  }

  return result;
}

function getAllVisibleCards(game: GameState): PokemonCard[] {
  const cards: PokemonCard[] = [];
  for (const level of [1, 2, 3] as const) {
    cards.push(...(game.board.revealed[level] || []));
  }
  if (game.board.rareRevealed) cards.push(game.board.rareRevealed);
  if (game.board.legendaryRevealed) cards.push(game.board.legendaryRevealed);
  return cards;
}

function smartTakeTokens(game: GameState, player: PlayerState): GameAction {
  // Try 3 different first
  const available = TOKEN_COLORS.filter(c => game.tokenSupply[c] > 0);

  if (available.length >= 3) {
    // Pick colors that help us most
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 3);
    const totalTokens = Object.values(player.tokens).reduce((a, b) => a + b, 0);
    if (totalTokens + 3 <= 10) {
      return {
        type: 'take_3_diff',
        playerId: player.id,
        tokens: Object.fromEntries(picked.map(c => [c, 1])) as Record<string, number>,
      };
    }
  }

  // Try 2 same
  const sameColor = TOKEN_COLORS.find(c => game.tokenSupply[c] >= 4);
  if (sameColor) {
    return {
      type: 'take_2_same',
      playerId: player.id,
      tokens: { [sameColor]: 2 } as Record<string, number>,
    };
  }

  // Fallback: take whatever we can
  if (available.length > 0) {
    const c = available[Math.floor(Math.random() * available.length)];
    return {
      type: 'take_3_diff',
      playerId: player.id,
      tokens: { [c]: 1 } as Record<string, number>,
    };
  }

  return { type: 'pass', playerId: player.id };
}

// Choose evolution for AI
export async function getAIEvolution(evolutions: Evolution[]): Promise<Evolution | null> {
  if (evolutions.length === 0) return null;
  await delay(300);
  // Pick highest point evolution
  return evolutions.sort((a, b) => b.to.points - a.to.points)[0];
}
