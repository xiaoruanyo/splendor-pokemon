import { cardDefinitions } from './cardDefinitions.js';
import type { PokemonCard, TokenCost } from './types.js';
import { ZERO_COST } from './types.js';

// Fisher-Yates shuffle
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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
): { affordable: boolean; shortage: number } {
  const cost = calculateCost(card, bonuses);
  let wildNeeded = cost.purple || 0;
  for (const color of ['red', 'blue', 'black', 'pink', 'yellow'] as const) {
    const s = Math.max(0, cost[color] - (tokens[color] || 0));
    wildNeeded += s;
  }
  return { affordable: wildNeeded <= (tokens.purple || 0), shortage: wildNeeded };
}

// Calculate required payment
export function calculatePayment(
  card: PokemonCard,
  tokens: Record<string, number>,
  bonuses: Record<string, number>
): TokenCost | null {
  const cost = calculateCost(card, bonuses);
  const payment: TokenCost = { ...ZERO_COST, purple: 0 };

  for (const color of ['red', 'blue', 'black', 'pink', 'yellow'] as const) {
    payment[color] = Math.min(cost[color], tokens[color] || 0);
  }

  let remaining = cost.purple || 0;
  for (const color of ['red', 'blue', 'black', 'pink', 'yellow'] as const) {
    remaining += cost[color] - payment[color];
  }

  if (remaining > (tokens.purple || 0)) return null;
  payment.purple = remaining;
  return payment;
}

// Check if requirements are met
export function meetsRequirement(bonuses: Record<string, number>, req: TokenCost): boolean {
  for (const color of ['red', 'blue', 'black', 'pink', 'yellow', 'purple'] as const) {
    if ((bonuses[color] || 0) < (req[color] || 0)) return false;
  }
  return true;
}

let cardIdCounter = 0;
export function generateCardId(): string {
  return `card_${++cardIdCounter}_${Date.now()}`;
}

export function createAllCards(): PokemonCard[] {
  return cardDefinitions.map(def => ({ ...structuredClone(def), id: generateCardId() } as PokemonCard));
}
