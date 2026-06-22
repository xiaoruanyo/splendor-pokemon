import type { PokemonCard, TokenCost } from '../types/game';
import { ZERO_COST } from '../types/game';

// Fisher-Yates shuffle
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Create a deck from card definitions
export function createDeck(cards: PokemonCard[]): PokemonCard[] {
  return shuffle(cards);
}

// Calculate actual cost after discounts
export function calculateCost(card: PokemonCard, bonuses: Record<string, number>): TokenCost {
  const cost = { ...card.cost };
  for (const color of ['red', 'blue', 'black', 'pink', 'yellow'] as const) {
    cost[color] = Math.max(0, cost[color] - (bonuses[color] || 0));
  }
  return cost;
}

// Check if player can afford a card
export function canAfford(
  card: PokemonCard,
  tokens: Record<string, number>,
  bonuses: Record<string, number>
): { affordable: boolean; shortage: number; cost: TokenCost } {
  const cost = calculateCost(card, bonuses);
  let wildNeeded = 0;
  for (const color of ['red', 'blue', 'black', 'pink', 'yellow'] as const) {
    const s = Math.max(0, cost[color] - (tokens[color] || 0));
    wildNeeded += s;
  }
  const affordable = wildNeeded <= (tokens.purple || 0);
  return { affordable, shortage: wildNeeded, cost };
}

// Calculate required payment tokens for a card purchase
export function calculatePayment(
  card: PokemonCard,
  tokens: Record<string, number>,
  bonuses: Record<string, number>
): TokenCost | null {
  const cost = calculateCost(card, bonuses);
  const payment: TokenCost = { ...ZERO_COST, purple: 0 };

  // First use specific color tokens
  for (const color of ['red', 'blue', 'black', 'pink', 'yellow'] as const) {
    const pay = Math.min(cost[color], tokens[color] || 0);
    payment[color] = pay;
  }

  // Fill remaining with purple (master ball)
  let remaining = 0;
  for (const color of ['red', 'blue', 'black', 'pink', 'yellow'] as const) {
    remaining += cost[color] - payment[color];
  }

  if (remaining > (tokens.purple || 0)) return null; // Can't afford
  payment.purple = remaining;
  return payment;
}

// Create a card ID
let cardIdCounter = 0;
export function generateCardId(): string {
  return `card_${++cardIdCounter}_${Date.now()}`;
}

// Sum up bonuses from owned cards
export function sumBonuses(cards: PokemonCard[]): Record<string, number> {
  const bonuses: Record<string, number> = { red: 0, blue: 0, black: 0, pink: 0, yellow: 0, purple: 0 };
  for (const card of cards) {
    bonuses[card.bonus] = (bonuses[card.bonus] || 0) + card.bonusCount;
  }
  return bonuses;
}

// Check if requirements are met
export function meetsRequirement(bonuses: Record<string, number>, req: TokenCost): boolean {
  for (const color of ['red', 'blue', 'black', 'pink', 'yellow', 'purple'] as const) {
    if ((bonuses[color] || 0) < (req[color] || 0)) return false;
  }
  return true;
}
