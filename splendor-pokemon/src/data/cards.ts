import type { PokemonCard } from '../types/game';
import { generateCardId } from '../engine/cards';
import { cardDefinitions } from './cardDefinitions';

export function createAllCards(): PokemonCard[] {
  return cardDefinitions.map(def => ({ ...structuredClone(def), id: generateCardId() } as PokemonCard));
}
