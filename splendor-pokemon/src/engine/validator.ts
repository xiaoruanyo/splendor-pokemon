import type { GameState, PlayerState, PokemonCard, TokenColor, CardLevel } from '../types/game';
import { MAX_TOKENS, MAX_RESERVED, TOKEN_COLORS } from '../types/game';

// Validate taking 3 different tokens
export function validateTake3Diff(game: GameState, player: PlayerState, tokens: TokenColor[]): string | null {
  if (tokens.length > 3) return '最多选择3枚精灵球';
  if (tokens.length === 0) return '请选择精灵球';

  // Check all different
  const unique = new Set(tokens);
  if (unique.size !== tokens.length) return '必须选择不同颜色的精灵球';

  // Check not purple
  if (tokens.includes('purple')) return '不能拿取大师球';

  // Check supply
  for (const color of tokens) {
    if (game.tokenSupply[color] <= 0) return `${color} 精灵球已耗尽`;
  }

  // Check hand limit
  const totalAfter = Object.values(player.tokens).reduce((a, b) => a + b, 0) + tokens.length;
  if (totalAfter > MAX_TOKENS) return `手持精灵球不能超过${MAX_TOKENS}枚`;

  return null;
}

// Validate taking 2 same tokens
export function validateTake2Same(game: GameState, player: PlayerState, color: TokenColor): string | null {
  if (color === 'purple') return '不能拿取大师球';
  if (game.tokenSupply[color] < 4) return '该颜色精灵球不足4枚，无法一次拿取2枚';

  const totalAfter = Object.values(player.tokens).reduce((a, b) => a + b, 0) + 2;
  if (totalAfter > MAX_TOKENS) return `手持精灵球不能超过${MAX_TOKENS}枚`;

  return null;
}

// Validate buying a card
export function validateBuyCard(
  game: GameState,
  player: PlayerState,
  card: PokemonCard,
  payment: Record<string, number>,
  source: 'board' | 'reserved'
): string | null {
  if (source === 'reserved' && !player.reservedCards.find(c => c.id === card.id)) {
    return '该卡牌不在你的保留区';
  }

  // Verify the card is actually where claimed
  if (source === 'board') {
    const onBoard = (game.board.revealed[card.level] || []).find(c => c.id === card.id)
      || game.board.rareRevealed?.id === card.id
      || game.board.legendaryRevealed?.id === card.id;
    if (!onBoard) return '该卡牌不在场上';
  }

  // Rare/legendary must use at least 1 purple
  if ((card.level === 'rare' || card.level === 'legendary') && (payment.purple || 0) < 1) {
    return '捕获稀有/传说宝可梦必须使用大师球';
  }

  // Verify player has enough tokens
  for (const color of ['red', 'blue', 'black', 'pink', 'yellow', 'purple'] as const) {
    if ((payment[color] || 0) > (player.tokens[color] || 0)) {
      return `你没有足够的对应精灵球`;
    }
  }

  // Verify payment covers cost after discounts
  const cost = { ...card.cost };
  for (const color of TOKEN_COLORS) {
    cost[color] = Math.max(0, cost[color] - (player.bonuses[color] || 0));
  }

  for (const color of TOKEN_COLORS) {
    const paid = (payment[color] || 0);
    if (paid > cost[color]) return '支付了多余的精灵球';
  }

  // Purple can substitute
  let totalPaid = 0;
  let totalCost = 0;
  for (const color of TOKEN_COLORS) {
    totalPaid += (payment[color] || 0);
    totalCost += cost[color];
  }
  totalPaid += (payment.purple || 0);

  if (totalPaid < totalCost) return '支付的精灵球不足';
  if (totalPaid > totalCost) return '支付了多余的精灵球';

  return null;
}

// Validate reserve
export function validateReserve(
  game: GameState,
  player: PlayerState,
  source: 'board' | 'deck',
  card?: PokemonCard,
  level?: CardLevel
): string | null {
  if (player.reservedCards.length >= MAX_RESERVED) return '保留区已满（最多3张）';

  if (source === 'board' && !card) return '请选择要保留的卡牌';
  if (source === 'deck' && !level) return '请选择牌堆';

  if (source === 'deck') {
    const deck = game.board.decks[level!];
    if (deck.length === 0) return '该牌堆已空';
  }

  // Check master ball availability
  if (game.tokenSupply.purple <= 0) return '大师球已耗尽，无法保留卡牌';

  return null;
}
