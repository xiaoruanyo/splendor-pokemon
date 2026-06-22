import type { PlayerState, BoardState, PokemonCard, Evolution } from './types.js';
import { meetsRequirement } from './cards.js';

export function getAvailableEvolutions(player: PlayerState, board: BoardState): Evolution[] {
  const evolutions: Evolution[] = [];
  const visibleCards: PokemonCard[] = [
    ...(board.revealed[1] || []), ...(board.revealed[2] || []), ...(board.revealed[3] || []),
    ...(board.rareRevealed ? [board.rareRevealed] : []),
    ...(board.legendaryRevealed ? [board.legendaryRevealed] : []),
    ...player.reservedCards,
  ];

  for (const evoCard of visibleCards) {
    if (!evoCard.evolutionOf || !evoCard.evolutionReq) continue;
    const baseCard = player.ownedCards.find(c => c.name === evoCard.evolutionOf);
    if (!baseCard) continue;
    if (meetsRequirement(player.bonuses, evoCard.evolutionReq)) {
      evolutions.push({ from: baseCard, to: evoCard });
    }
  }
  return evolutions;
}

export function executeEvolution(
  player: PlayerState, evolution: Evolution, board: BoardState
): { success: boolean; message: string } {
  if (!player.ownedCards.find(c => c.id === evolution.from.id)) {
    return { success: false, message: '基础宝可梦不在你的队伍中' };
  }
  if (!meetsRequirement(player.bonuses, evolution.to.evolutionReq!)) {
    return { success: false, message: '不满足进化条件' };
  }

  player.ownedCards = player.ownedCards.filter(c => c.id !== evolution.from.id);
  player.bonuses[evolution.from.bonus] -= evolution.from.bonusCount;

  const boardIdx = (board.revealed[evolution.to.level] || []).findIndex(c => c.id === evolution.to.id);
  if (boardIdx !== -1) board.revealed[evolution.to.level]!.splice(boardIdx, 1);
  else if (board.rareRevealed?.id === evolution.to.id) board.rareRevealed = null;
  else if (board.legendaryRevealed?.id === evolution.to.id) board.legendaryRevealed = null;
  else player.reservedCards = player.reservedCards.filter(c => c.id !== evolution.to.id);

  player.ownedCards.push(evolution.to);
  player.bonuses[evolution.to.bonus] = (player.bonuses[evolution.to.bonus] || 0) + evolution.to.bonusCount;
  player.score += evolution.to.points;
  player.evolutionCount++;

  return { success: true, message: `${evolution.from.name} 进化成了 ${evolution.to.name}！` };
}
