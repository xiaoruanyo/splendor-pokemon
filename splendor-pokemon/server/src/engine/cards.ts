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
  let wildNeeded = 0;
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

  let remaining = 0;
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

// ===== Card Data =====
function spriteUrl(id: number): string {
  return `/assets/pokemon/${id}.png`;
}

function c(red = 0, blue = 0, black = 0, pink = 0, yellow = 0, purple = 0): TokenCost {
  return { red, blue, black, pink, yellow, purple };
}

export function createAllCards(): PokemonCard[] {
  const cards: PokemonCard[] = [];

  // Level 1 (40 cards)
  const l1 = [
    { name: '小火龙', s: 4, p: 0, cost: c(2,0,0,0,1), bonus: 'red' as const },
    { name: '火球鼠', s: 155, p: 0, cost: c(0,0,1,0,2), bonus: 'red' as const },
    { name: '火稚鸡', s: 255, p: 0, cost: c(1,1,0,1,0), bonus: 'red' as const },
    { name: '小火猴', s: 390, p: 0, cost: c(0,2,0,0,1), bonus: 'red' as const },
    { name: '卡蒂狗', s: 58, p: 0, cost: c(1,1,1,0,0), bonus: 'red' as const },
    { name: '六尾', s: 37, p: 0, cost: c(1,2,0,0,0), bonus: 'pink' as const },
    { name: '杰尼龟', s: 7, p: 0, cost: c(0,2,0,0,1), bonus: 'blue' as const },
    { name: '小锯鳄', s: 158, p: 0, cost: c(1,0,0,1,1), bonus: 'blue' as const },
    { name: '水跃鱼', s: 258, p: 0, cost: c(2,0,1,0,0), bonus: 'blue' as const },
    { name: '波加曼', s: 393, p: 0, cost: c(0,1,0,2,0), bonus: 'blue' as const },
    { name: '鲤鱼王', s: 129, p: 0, cost: c(1,0,1,0,1), bonus: 'blue' as const },
    { name: '可达鸭', s: 54, p: 0, cost: c(0,1,0,1,1), bonus: 'blue' as const },
    { name: '妙蛙种子', s: 1, p: 0, cost: c(0,0,2,0,1), bonus: 'black' as const },
    { name: '菊草叶', s: 152, p: 0, cost: c(1,0,0,0,2), bonus: 'black' as const },
    { name: '木守宫', s: 252, p: 0, cost: c(2,1,0,0,0), bonus: 'black' as const },
    { name: '草苗龟', s: 387, p: 0, cost: c(0,0,1,1,1), bonus: 'black' as const },
    { name: '走路草', s: 43, p: 0, cost: c(4,0,0,0,0), bonus: 'black' as const },
    { name: '皮卡丘', s: 25, p: 1, cost: c(0,0,0,2,2), bonus: 'yellow' as const },
    { name: '咩利羊', s: 179, p: 0, cost: c(1,1,0,0,1), bonus: 'yellow' as const },
    { name: '电击怪', s: 239, p: 0, cost: c(0,0,0,1,3), bonus: 'yellow' as const },
    { name: '落雷兽', s: 309, p: 0, cost: c(1,0,1,1,0), bonus: 'yellow' as const },
    { name: '伊布', s: 133, p: 0, cost: c(1,1,1,1,0), bonus: 'pink' as const },
    { name: '胖丁', s: 39, p: 0, cost: c(0,0,1,3,0), bonus: 'pink' as const },
    { name: '皮皮', s: 35, p: 0, cost: c(0,0,3,0,1), bonus: 'pink' as const },
    { name: '吉利蛋', s: 113, p: 1, cost: c(0,1,0,3,0), bonus: 'pink' as const },
    { name: '波克比', s: 175, p: 0, cost: c(0,3,0,0,1), bonus: 'pink' as const },
    { name: '腕力', s: 66, p: 0, cost: c(0,1,3,0,0), bonus: 'red' as const },
    { name: '小拳石', s: 74, p: 0, cost: c(2,0,2,0,0), bonus: 'black' as const },
    { name: '猴怪', s: 56, p: 0, cost: c(3,0,0,1,0), bonus: 'red' as const },
    { name: '凯西', s: 63, p: 0, cost: c(0,0,0,1,3), bonus: 'yellow' as const },
    { name: '拉鲁拉丝', s: 280, p: 0, cost: c(0,2,0,2,0), bonus: 'pink' as const },
    { name: '鬼斯', s: 92, p: 0, cost: c(0,1,2,0,1), bonus: 'black' as const },
    { name: '狃拉', s: 215, p: 0, cost: c(0,0,2,1,0), bonus: 'blue' as const },
    { name: '小磁怪', s: 81, p: 0, cost: c(0,2,0,0,2), bonus: 'yellow' as const },
    { name: '独角犀牛', s: 111, p: 0, cost: c(2,0,0,0,2), bonus: 'black' as const },
    { name: '穿山鼠', s: 27, p: 0, cost: c(0,1,0,0,3), bonus: 'black' as const },
    { name: '迷你龙', s: 147, p: 1, cost: c(1,2,0,0,1), bonus: 'blue' as const },
    { name: '宝贝龙', s: 371, p: 0, cost: c(1,0,2,0,0), bonus: 'red' as const },
    { name: '绿毛虫', s: 10, p: 0, cost: c(0,1,0,2,0), bonus: 'black' as const },
    { name: '独角虫', s: 13, p: 0, cost: c(3,0,0,0,1), bonus: 'black' as const },
    { name: '飞天螳螂', s: 123, p: 0, cost: c(1,0,2,1,0), bonus: 'black' as const },
  ];
  for (const d of l1) cards.push({ id: generateCardId(), name: d.name, level: 1, points: d.p, cost: d.cost, bonus: d.bonus, bonusCount: 1, image: spriteUrl(d.s) });

  // Level 2 (30 cards)
  const l2 = [
    { name: '火恐龙', s: 5, p: 1, cost: c(0,0,3,0,2), bonus: 'red' as const, eOf: '小火龙', eReq: c(2,0,0,0,2) },
    { name: '火岩鼠', s: 156, p: 1, cost: c(1,0,0,4,0), bonus: 'red' as const, eOf: '火球鼠', eReq: c(0,2,2,0,0) },
    { name: '力壮鸡', s: 256, p: 1, cost: c(2,2,0,0,1), bonus: 'red' as const, eOf: '火稚鸡', eReq: c(1,0,0,2,1) },
    { name: '猛火猴', s: 391, p: 1, cost: c(0,3,1,1,0), bonus: 'red' as const, eOf: '小火猴', eReq: c(3,0,1,0,0) },
    { name: '风速狗', s: 59, p: 2, cost: c(3,0,0,1,2), bonus: 'red' as const, eOf: '卡蒂狗', eReq: c(0,0,2,2,0) },
    { name: '九尾', s: 38, p: 2, cost: c(2,0,0,2,2), bonus: 'pink' as const, eOf: '六尾', eReq: c(2,1,0,1,0) },
    { name: '卡咪龟', s: 8, p: 1, cost: c(0,1,0,2,2), bonus: 'blue' as const, eOf: '杰尼龟', eReq: c(0,3,0,1,0) },
    { name: '蓝鳄', s: 159, p: 1, cost: c(0,0,0,3,3), bonus: 'blue' as const, eOf: '小锯鳄', eReq: c(1,0,1,2,0) },
    { name: '沼跃鱼', s: 259, p: 1, cost: c(3,1,0,0,1), bonus: 'blue' as const, eOf: '水跃鱼', eReq: c(0,0,2,0,2) },
    { name: '波皇子', s: 394, p: 1, cost: c(0,2,2,0,1), bonus: 'blue' as const, eOf: '波加曼', eReq: c(0,2,0,0,2) },
    { name: '暴鲤龙', s: 130, p: 3, cost: c(0,4,2,0,0), bonus: 'blue' as const, eOf: '鲤鱼王', eReq: c(0,0,3,2,0) },
    { name: '哥达鸭', s: 55, p: 2, cost: c(0,3,0,0,3), bonus: 'blue' as const, eOf: '可达鸭', eReq: c(2,0,0,3,0) },
    { name: '妙蛙草', s: 2, p: 1, cost: c(1,0,0,2,2), bonus: 'black' as const, eOf: '妙蛙种子', eReq: c(0,2,1,0,1) },
    { name: '月桂叶', s: 153, p: 1, cost: c(2,0,2,0,1), bonus: 'black' as const, eOf: '菊草叶', eReq: c(0,0,2,2,0) },
    { name: '森林蜥蜴', s: 253, p: 1, cost: c(1,3,0,0,1), bonus: 'black' as const, eOf: '木守宫', eReq: c(2,0,0,2,0) },
    { name: '树林龟', s: 388, p: 1, cost: c(0,0,0,4,2), bonus: 'black' as const, eOf: '草苗龟', eReq: c(0,1,2,0,2) },
    { name: '雷丘', s: 26, p: 2, cost: c(0,0,1,3,2), bonus: 'yellow' as const, eOf: '皮卡丘', eReq: c(0,0,2,2,1) },
    { name: '茸茸羊', s: 180, p: 1, cost: c(2,0,0,1,3), bonus: 'yellow' as const, eOf: '咩利羊', eReq: c(1,0,0,1,3) },
    { name: '电击兽', s: 125, p: 2, cost: c(0,0,3,0,3), bonus: 'yellow' as const, eOf: '电击怪', eReq: c(2,0,0,0,3) },
    { name: '豪力', s: 67, p: 1, cost: c(0,0,3,2,0), bonus: 'red' as const, eOf: '腕力', eReq: c(1,0,2,1,0) },
    { name: '隆隆石', s: 75, p: 1, cost: c(2,0,0,0,3), bonus: 'black' as const, eOf: '小拳石', eReq: c(3,1,0,0,0) },
    { name: '勇基拉', s: 64, p: 2, cost: c(0,0,2,2,2), bonus: 'yellow' as const, eOf: '凯西', eReq: c(1,0,0,2,2) },
    { name: '奇鲁莉安', s: 281, p: 1, cost: c(0,2,0,0,3), bonus: 'pink' as const, eOf: '拉鲁拉丝', eReq: c(0,1,0,1,2) },
    { name: '鬼斯通', s: 93, p: 1, cost: c(0,0,2,1,2), bonus: 'black' as const, eOf: '鬼斯', eReq: c(2,0,1,0,1) },
    { name: '三合一磁怪', s: 82, p: 1, cost: c(0,3,0,0,2), bonus: 'yellow' as const, eOf: '小磁怪', eReq: c(1,1,0,2,1) },
    { name: '哈克龙', s: 148, p: 2, cost: c(2,0,0,3,1), bonus: 'blue' as const, eOf: '迷你龙', eReq: c(1,1,2,0,1) },
    { name: '甲壳龙', s: 372, p: 1, cost: c(0,2,2,1,0), bonus: 'red' as const, eOf: '宝贝龙', eReq: c(0,2,1,1,0) },
    { name: '铁甲蛹', s: 11, p: 0, cost: c(0,2,0,0,3), bonus: 'black' as const, eOf: '绿毛虫', eReq: c(0,1,0,2,0) },
    { name: '大针蜂', s: 15, p: 2, cost: c(2,0,0,0,4), bonus: 'black' as const, eOf: '独角虫', eReq: c(1,0,0,0,3) },
  ];
  for (const d of l2) cards.push({ id: generateCardId(), name: d.name, level: 2, points: d.p, cost: d.cost, bonus: d.bonus, bonusCount: 1, evolutionOf: d.eOf, evolutionReq: d.eReq, image: spriteUrl(d.s) });

  // Level 3 (10 cards)
  const l3 = [
    { name: '喷火龙', s: 6, p: 4, cost: c(0,0,3,0,5), bonus: 'red' as const, eOf: '火恐龙', eReq: c(3,0,2,0,1) },
    { name: '水箭龟', s: 9, p: 4, cost: c(0,4,0,0,4), bonus: 'blue' as const, eOf: '卡咪龟', eReq: c(0,3,2,0,1) },
    { name: '妙蛙花', s: 3, p: 4, cost: c(0,0,5,3,0), bonus: 'black' as const, eOf: '妙蛙草', eReq: c(0,0,4,1,1) },
    { name: '怪力', s: 68, p: 3, cost: c(5,0,3,0,0), bonus: 'red' as const, eOf: '豪力', eReq: c(0,0,3,0,2) },
    { name: '胡地', s: 65, p: 5, cost: c(0,0,2,0,6), bonus: 'yellow' as const, eOf: '勇基拉', eReq: c(2,0,0,1,3) },
    { name: '耿鬼', s: 94, p: 4, cost: c(0,0,5,0,3), bonus: 'black' as const, eOf: '鬼斯通', eReq: c(1,0,3,0,2) },
    { name: '快龙', s: 149, p: 5, cost: c(0,5,0,3,0), bonus: 'blue' as const, eOf: '哈克龙', eReq: c(1,3,0,2,0) },
    { name: '暴飞龙', s: 373, p: 4, cost: c(6,0,0,0,2), bonus: 'red' as const, eOf: '甲壳龙', eReq: c(3,0,2,1,0) },
    { name: '沙奈朵', s: 282, p: 3, cost: c(0,0,0,5,3), bonus: 'pink' as const, eOf: '奇鲁莉安', eReq: c(1,0,0,4,0) },
    { name: '隆隆岩', s: 76, p: 3, cost: c(4,0,4,0,0), bonus: 'black' as const, eOf: '隆隆石', eReq: c(0,0,2,1,1) },
  ];
  for (const d of l3) cards.push({ id: generateCardId(), name: d.name, level: 3, points: d.p, cost: d.cost, bonus: d.bonus, bonusCount: 1, evolutionOf: d.eOf, evolutionReq: d.eReq, image: spriteUrl(d.s) });

  // Rare (5 cards)
  const rare = [
    { name: '火焰鸟', s: 146, p: 3, cost: c(3,0,0,2,0,1), bonus: 'red' as const },
    { name: '急冻鸟', s: 144, p: 3, cost: c(0,3,0,0,2,1), bonus: 'blue' as const },
    { name: '闪电鸟', s: 145, p: 3, cost: c(0,0,0,2,3,1), bonus: 'yellow' as const },
    { name: '卡比兽', s: 143, p: 4, cost: c(2,0,2,0,2,1), bonus: 'pink' as const },
    { name: '拉普拉斯', s: 131, p: 3, cost: c(0,2,0,3,0,1), bonus: 'blue' as const },
  ];
  for (const d of rare) cards.push({ id: generateCardId(), name: d.name, level: 'rare', points: d.p, cost: d.cost, bonus: d.bonus, bonusCount: 2, image: spriteUrl(d.s) });

  // Legendary (5 cards)
  const leg = [
    { name: '超梦', s: 150, p: 5, cost: c(2,2,2,0,0,1), bonus: 'purple' as const },
    { name: '梦幻', s: 151, p: 4, cost: c(0,2,0,2,2,1), bonus: 'purple' as const },
    { name: '洛奇亚', s: 249, p: 5, cost: c(0,3,3,0,0,1), bonus: 'blue' as const },
    { name: '凤王', s: 250, p: 5, cost: c(3,0,0,3,0,1), bonus: 'red' as const },
    { name: '烈空坐', s: 384, p: 5, cost: c(0,0,3,0,3,1), bonus: 'black' as const },
  ];
  for (const d of leg) cards.push({ id: generateCardId(), name: d.name, level: 'legendary', points: d.p, cost: d.cost, bonus: d.bonus, bonusCount: 2, image: spriteUrl(d.s) });

  return cards;
}
