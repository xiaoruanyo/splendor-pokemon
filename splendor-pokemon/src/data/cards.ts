import type { PokemonCard, TokenCost } from '../types/game';
import { generateCardId } from '../engine/cards';

// Helper to create cost objects
function c(red = 0, blue = 0, black = 0, pink = 0, yellow = 0, purple = 0): TokenCost {
  return { red, blue, black, pink, yellow, purple };
}

// Pokémon sprite URLs from PokéAPI
function spriteUrl(id: number): string {
  return `/assets/pokemon/${id}.png`;
}

export function createAllCards(): PokemonCard[] {
  const cards: PokemonCard[] = [];

  // Build a name→spriteId map by collecting ALL defs first
  const allDefs: { name: string; spriteId: number }[] = [];

  // ============ LEVEL 1 (40 cards) - Basic Pokémon, cost 0-1 points ============
  const level1Defs = [
    // Fire types
    { name: '小火龙', spriteId: 4, points: 0, cost: c(2,0,0,0,1), bonus: 'red' as const, evoOf: undefined, evoReq: undefined },
    { name: '火球鼠', spriteId: 155, points: 0, cost: c(0,0,1,0,2), bonus: 'red' as const, evoOf: undefined, evoReq: undefined },
    { name: '火稚鸡', spriteId: 255, points: 0, cost: c(1,1,0,1,0), bonus: 'red' as const, evoOf: undefined, evoReq: undefined },
    { name: '小火猴', spriteId: 390, points: 0, cost: c(0,2,0,0,1), bonus: 'red' as const, evoOf: undefined, evoReq: undefined },
    { name: '卡蒂狗', spriteId: 58, points: 0, cost: c(1,1,1,0,0), bonus: 'red' as const, evoOf: undefined, evoReq: undefined },
    { name: '六尾', spriteId: 37, points: 0, cost: c(1,2,0,0,0), bonus: 'pink' as const, evoOf: undefined, evoReq: undefined },

    // Water types
    { name: '杰尼龟', spriteId: 7, points: 0, cost: c(0,2,0,0,1), bonus: 'blue' as const, evoOf: undefined, evoReq: undefined },
    { name: '小锯鳄', spriteId: 158, points: 0, cost: c(1,0,0,1,1), bonus: 'blue' as const, evoOf: undefined, evoReq: undefined },
    { name: '水跃鱼', spriteId: 258, points: 0, cost: c(2,0,1,0,0), bonus: 'blue' as const, evoOf: undefined, evoReq: undefined },
    { name: '波加曼', spriteId: 393, points: 0, cost: c(0,1,0,2,0), bonus: 'blue' as const, evoOf: undefined, evoReq: undefined },
    { name: '鲤鱼王', spriteId: 129, points: 0, cost: c(1,0,1,0,1), bonus: 'blue' as const, evoOf: undefined, evoReq: undefined },
    { name: '可达鸭', spriteId: 54, points: 0, cost: c(0,1,0,1,1), bonus: 'blue' as const, evoOf: undefined, evoReq: undefined },

    // Grass types
    { name: '妙蛙种子', spriteId: 1, points: 0, cost: c(0,0,2,0,1), bonus: 'black' as const, evoOf: undefined, evoReq: undefined },
    { name: '菊草叶', spriteId: 152, points: 0, cost: c(1,0,0,0,2), bonus: 'black' as const, evoOf: undefined, evoReq: undefined },
    { name: '木守宫', spriteId: 252, points: 0, cost: c(2,1,0,0,0), bonus: 'black' as const, evoOf: undefined, evoReq: undefined },
    { name: '草苗龟', spriteId: 387, points: 0, cost: c(0,0,1,1,1), bonus: 'black' as const, evoOf: undefined, evoReq: undefined },
    { name: '走路草', spriteId: 43, points: 0, cost: c(4,0,0,0,0), bonus: 'black' as const, evoOf: undefined, evoReq: undefined },

    // Electric types
    { name: '皮卡丘', spriteId: 25, points: 1, cost: c(0,0,0,2,2), bonus: 'yellow' as const, evoOf: undefined, evoReq: undefined },
    { name: '咩利羊', spriteId: 179, points: 0, cost: c(1,1,0,0,1), bonus: 'yellow' as const, evoOf: undefined, evoReq: undefined },
    { name: '电击怪', spriteId: 239, points: 0, cost: c(0,0,0,1,3), bonus: 'yellow' as const, evoOf: undefined, evoReq: undefined },
    { name: '落雷兽', spriteId: 309, points: 0, cost: c(1,0,1,1,0), bonus: 'yellow' as const, evoOf: undefined, evoReq: undefined },

    // Normal/Fairy types
    { name: '伊布', spriteId: 133, points: 0, cost: c(1,1,1,1,0), bonus: 'pink' as const, evoOf: undefined, evoReq: undefined },
    { name: '胖丁', spriteId: 39, points: 0, cost: c(0,0,1,3,0), bonus: 'pink' as const, evoOf: undefined, evoReq: undefined },
    { name: '皮皮', spriteId: 35, points: 0, cost: c(0,0,3,0,1), bonus: 'pink' as const, evoOf: undefined, evoReq: undefined },
    { name: '吉利蛋', spriteId: 113, points: 1, cost: c(0,1,0,3,0), bonus: 'pink' as const, evoOf: undefined, evoReq: undefined },
    { name: '波克比', spriteId: 175, points: 0, cost: c(0,3,0,0,1), bonus: 'pink' as const, evoOf: undefined, evoReq: undefined },

    // Fighting/Rock types
    { name: '腕力', spriteId: 66, points: 0, cost: c(0,1,3,0,0), bonus: 'red' as const, evoOf: undefined, evoReq: undefined },
    { name: '小拳石', spriteId: 74, points: 0, cost: c(2,0,2,0,0), bonus: 'black' as const, evoOf: undefined, evoReq: undefined },
    { name: '猴怪', spriteId: 56, points: 0, cost: c(3,0,0,1,0), bonus: 'red' as const, evoOf: undefined, evoReq: undefined },

    // Psychic types
    { name: '凯西', spriteId: 63, points: 0, cost: c(0,0,0,1,3), bonus: 'yellow' as const, evoOf: undefined, evoReq: undefined },
    { name: '拉鲁拉丝', spriteId: 280, points: 0, cost: c(0,2,0,2,0), bonus: 'pink' as const, evoOf: undefined, evoReq: undefined },

    // Dark/Ghost
    { name: '鬼斯', spriteId: 92, points: 0, cost: c(0,1,2,0,1), bonus: 'black' as const, evoOf: undefined, evoReq: undefined },
    { name: '狃拉', spriteId: 215, points: 0, cost: c(0,0,2,1,0), bonus: 'blue' as const, evoOf: undefined, evoReq: undefined },

    // Steel/Ground
    { name: '小磁怪', spriteId: 81, points: 0, cost: c(0,2,0,0,2), bonus: 'yellow' as const, evoOf: undefined, evoReq: undefined },
    { name: '独角犀牛', spriteId: 111, points: 0, cost: c(2,0,0,0,2), bonus: 'black' as const, evoOf: undefined, evoReq: undefined },
    { name: '穿山鼠', spriteId: 27, points: 0, cost: c(0,1,0,0,3), bonus: 'black' as const, evoOf: undefined, evoReq: undefined },

    // Dragon
    { name: '迷你龙', spriteId: 147, points: 1, cost: c(1,2,0,0,1), bonus: 'blue' as const, evoOf: undefined, evoReq: undefined },
    { name: '宝贝龙', spriteId: 371, points: 0, cost: c(1,0,2,0,0), bonus: 'red' as const, evoOf: undefined, evoReq: undefined },

    // Bug
    { name: '绿毛虫', spriteId: 10, points: 0, cost: c(0,1,0,2,0), bonus: 'black' as const, evoOf: undefined, evoReq: undefined },
    { name: '独角虫', spriteId: 13, points: 0, cost: c(3,0,0,0,1), bonus: 'black' as const, evoOf: undefined, evoReq: undefined },
    { name: '飞天螳螂', spriteId: 123, points: 0, cost: c(1,0,2,1,0), bonus: 'black' as const, evoOf: undefined, evoReq: undefined },
  ];

  // Collect all defs for building evolution image lookup
  for (const def of level1Defs) allDefs.push(def);
  const nameToSprite: Record<string, number> = {};
  for (const def of allDefs) nameToSprite[def.name] = def.spriteId;

  for (const def of level1Defs) {
    cards.push({
      id: generateCardId(),
      name: def.name,
      level: 1,
      points: def.points,
      cost: def.cost,
      bonus: def.bonus,
      bonusCount: 1,
      evolutionOf: def.evoOf,
      evolutionReq: def.evoReq,
      image: spriteUrl(def.spriteId),
    });
  }

  // ============ LEVEL 2 (30 cards) - Stage 1 evolutions, 1-3 points ============
  const level2Defs = [
    // Fire evolutions
    { name: '火恐龙', spriteId: 5, points: 1, cost: c(0,0,3,0,2), bonus: 'red' as const, evoOf: '小火龙', evoReq: c(2,0,0,0,2) },
    { name: '火岩鼠', spriteId: 156, points: 1, cost: c(1,0,0,4,0), bonus: 'red' as const, evoOf: '火球鼠', evoReq: c(0,2,2,0,0) },
    { name: '力壮鸡', spriteId: 256, points: 1, cost: c(2,2,0,0,1), bonus: 'red' as const, evoOf: '火稚鸡', evoReq: c(1,0,0,2,1) },
    { name: '猛火猴', spriteId: 391, points: 1, cost: c(0,3,1,1,0), bonus: 'red' as const, evoOf: '小火猴', evoReq: c(3,0,1,0,0) },
    { name: '风速狗', spriteId: 59, points: 2, cost: c(3,0,0,1,2), bonus: 'red' as const, evoOf: '卡蒂狗', evoReq: c(0,0,2,2,0) },
    { name: '九尾', spriteId: 38, points: 2, cost: c(2,0,0,2,2), bonus: 'pink' as const, evoOf: '六尾', evoReq: c(2,1,0,1,0) },

    // Water evolutions
    { name: '卡咪龟', spriteId: 8, points: 1, cost: c(0,1,0,2,2), bonus: 'blue' as const, evoOf: '杰尼龟', evoReq: c(0,3,0,1,0) },
    { name: '蓝鳄', spriteId: 159, points: 1, cost: c(0,0,0,3,3), bonus: 'blue' as const, evoOf: '小锯鳄', evoReq: c(1,0,1,2,0) },
    { name: '沼跃鱼', spriteId: 259, points: 1, cost: c(3,1,0,0,1), bonus: 'blue' as const, evoOf: '水跃鱼', evoReq: c(0,0,2,0,2) },
    { name: '波皇子', spriteId: 394, points: 1, cost: c(0,2,2,0,1), bonus: 'blue' as const, evoOf: '波加曼', evoReq: c(0,2,0,0,2) },
    { name: '暴鲤龙', spriteId: 130, points: 3, cost: c(0,4,2,0,0), bonus: 'blue' as const, evoOf: '鲤鱼王', evoReq: c(0,0,3,2,0) },
    { name: '哥达鸭', spriteId: 55, points: 2, cost: c(0,3,0,0,3), bonus: 'blue' as const, evoOf: '可达鸭', evoReq: c(2,0,0,3,0) },

    // Grass evolutions
    { name: '妙蛙草', spriteId: 2, points: 1, cost: c(1,0,0,2,2), bonus: 'black' as const, evoOf: '妙蛙种子', evoReq: c(0,2,1,0,1) },
    { name: '月桂叶', spriteId: 153, points: 1, cost: c(2,0,2,0,1), bonus: 'black' as const, evoOf: '菊草叶', evoReq: c(0,0,2,2,0) },
    { name: '森林蜥蜴', spriteId: 253, points: 1, cost: c(1,3,0,0,1), bonus: 'black' as const, evoOf: '木守宫', evoReq: c(2,0,0,2,0) },
    { name: '树林龟', spriteId: 388, points: 1, cost: c(0,0,0,4,2), bonus: 'black' as const, evoOf: '草苗龟', evoReq: c(0,1,2,0,2) },

    // Electric evolutions
    { name: '雷丘', spriteId: 26, points: 2, cost: c(0,0,1,3,2), bonus: 'yellow' as const, evoOf: '皮卡丘', evoReq: c(0,0,2,2,1) },
    { name: '茸茸羊', spriteId: 180, points: 1, cost: c(2,0,0,1,3), bonus: 'yellow' as const, evoOf: '咩利羊', evoReq: c(1,0,0,1,3) },
    { name: '电击兽', spriteId: 125, points: 2, cost: c(0,0,3,0,3), bonus: 'yellow' as const, evoOf: '电击怪', evoReq: c(2,0,0,0,3) },

    // Fighting/Rock evolutions
    { name: '豪力', spriteId: 67, points: 1, cost: c(0,0,3,2,0), bonus: 'red' as const, evoOf: '腕力', evoReq: c(1,0,2,1,0) },
    { name: '隆隆石', spriteId: 75, points: 1, cost: c(2,0,0,0,3), bonus: 'black' as const, evoOf: '小拳石', evoReq: c(3,1,0,0,0) },

    // Psychic evolutions
    { name: '勇基拉', spriteId: 64, points: 2, cost: c(0,0,2,2,2), bonus: 'yellow' as const, evoOf: '凯西', evoReq: c(1,0,0,2,2) },
    { name: '奇鲁莉安', spriteId: 281, points: 1, cost: c(0,2,0,0,3), bonus: 'pink' as const, evoOf: '拉鲁拉丝', evoReq: c(0,1,0,1,2) },

    // Ghost/Poison
    { name: '鬼斯通', spriteId: 93, points: 1, cost: c(0,0,2,1,2), bonus: 'black' as const, evoOf: '鬼斯', evoReq: c(2,0,1,0,1) },

    // Steel
    { name: '三合一磁怪', spriteId: 82, points: 1, cost: c(0,3,0,0,2), bonus: 'yellow' as const, evoOf: '小磁怪', evoReq: c(1,1,0,2,1) },

    // Dragon
    { name: '哈克龙', spriteId: 148, points: 2, cost: c(2,0,0,3,1), bonus: 'blue' as const, evoOf: '迷你龙', evoReq: c(1,1,2,0,1) },
    { name: '甲壳龙', spriteId: 372, points: 1, cost: c(0,2,2,1,0), bonus: 'red' as const, evoOf: '宝贝龙', evoReq: c(0,2,1,1,0) },

    // Bug evolutions
    { name: '铁甲蛹', spriteId: 11, points: 0, cost: c(0,2,0,0,3), bonus: 'black' as const, evoOf: '绿毛虫', evoReq: c(0,1,0,2,0) },
    { name: '大针蜂', spriteId: 15, points: 2, cost: c(2,0,0,0,4), bonus: 'black' as const, evoOf: '独角虫', evoReq: c(1,0,0,0,3) },
  ];

  for (const def of level2Defs) allDefs.push(def);
  for (const def of level2Defs) nameToSprite[def.name] = def.spriteId;

  for (const def of level2Defs) {
    cards.push({
      id: generateCardId(),
      name: def.name,
      level: 2,
      points: def.points,
      cost: def.cost,
      bonus: def.bonus,
      bonusCount: 1,
      evolutionOf: def.evoOf,
      evolutionReq: def.evoReq,
      evolutionOfImage: def.evoOf ? spriteUrl(nameToSprite[def.evoOf]) : undefined,
      image: spriteUrl(def.spriteId),
    });
  }

  // ============ LEVEL 3 (10 cards) - Stage 2 evolutions, 3-5 points ============
  const level3Defs = [
    { name: '喷火龙', spriteId: 6, points: 4, cost: c(0,0,3,0,5), bonus: 'red' as const, evoOf: '火恐龙', evoReq: c(3,0,2,0,1) },
    { name: '水箭龟', spriteId: 9, points: 4, cost: c(0,4,0,0,4), bonus: 'blue' as const, evoOf: '卡咪龟', evoReq: c(0,3,2,0,1) },
    { name: '妙蛙花', spriteId: 3, points: 4, cost: c(0,0,5,3,0), bonus: 'black' as const, evoOf: '妙蛙草', evoReq: c(0,0,4,1,1) },
    { name: '怪力', spriteId: 68, points: 3, cost: c(5,0,3,0,0), bonus: 'red' as const, evoOf: '豪力', evoReq: c(0,0,3,0,2) },
    { name: '胡地', spriteId: 65, points: 5, cost: c(0,0,2,0,6), bonus: 'yellow' as const, evoOf: '勇基拉', evoReq: c(2,0,0,1,3) },
    { name: '耿鬼', spriteId: 94, points: 4, cost: c(0,0,5,0,3), bonus: 'black' as const, evoOf: '鬼斯通', evoReq: c(1,0,3,0,2) },
    { name: '快龙', spriteId: 149, points: 5, cost: c(0,5,0,3,0), bonus: 'blue' as const, evoOf: '哈克龙', evoReq: c(1,3,0,2,0) },
    { name: '暴飞龙', spriteId: 373, points: 4, cost: c(6,0,0,0,2), bonus: 'red' as const, evoOf: '甲壳龙', evoReq: c(3,0,2,1,0) },
    { name: '沙奈朵', spriteId: 282, points: 3, cost: c(0,0,0,5,3), bonus: 'pink' as const, evoOf: '奇鲁莉安', evoReq: c(1,0,0,4,0) },
    { name: '隆隆岩', spriteId: 76, points: 3, cost: c(4,0,4,0,0), bonus: 'black' as const, evoOf: '隆隆石', evoReq: c(0,0,2,1,1) },
  ];

  for (const def of level3Defs) allDefs.push(def);
  for (const def of level3Defs) nameToSprite[def.name] = def.spriteId;

  for (const def of level3Defs) {
    cards.push({
      id: generateCardId(),
      name: def.name,
      level: 3,
      points: def.points,
      cost: def.cost,
      bonus: def.bonus,
      bonusCount: 1,
      evolutionOf: def.evoOf,
      evolutionReq: def.evoReq,
      evolutionOfImage: def.evoOf ? spriteUrl(nameToSprite[def.evoOf]) : undefined,
      image: spriteUrl(def.spriteId),
    });
  }

  // ============ RARE (5 cards) - 3-4 points, double bonus, requires master ball ============
  const rareDefs = [
    { name: '火焰鸟', spriteId: 146, points: 3, cost: c(3,0,0,2,0,1), bonus: 'red' as const },
    { name: '急冻鸟', spriteId: 144, points: 3, cost: c(0,3,0,0,2,1), bonus: 'blue' as const },
    { name: '闪电鸟', spriteId: 145, points: 3, cost: c(0,0,0,2,3,1), bonus: 'yellow' as const },
    { name: '卡比兽', spriteId: 143, points: 4, cost: c(2,0,2,0,2,1), bonus: 'pink' as const },
    { name: '拉普拉斯', spriteId: 131, points: 3, cost: c(0,2,0,3,0,1), bonus: 'blue' as const },
  ];

  for (const def of rareDefs) {
    cards.push({
      id: generateCardId(),
      name: def.name,
      level: 'rare',
      points: def.points,
      cost: def.cost,
      bonus: def.bonus,
      bonusCount: 2,
      image: spriteUrl(def.spriteId),
    });
  }

  // ============ LEGENDARY (5 cards) - 4-5 points, double bonus, requires master ball ============
  const legendaryDefs = [
    { name: '超梦', spriteId: 150, points: 5, cost: c(2,2,2,0,0,1), bonus: 'purple' as const },
    { name: '梦幻', spriteId: 151, points: 4, cost: c(0,2,0,2,2,1), bonus: 'purple' as const },
    { name: '洛奇亚', spriteId: 249, points: 5, cost: c(0,3,3,0,0,1), bonus: 'blue' as const },
    { name: '凤王', spriteId: 250, points: 5, cost: c(3,0,0,3,0,1), bonus: 'red' as const },
    { name: '烈空坐', spriteId: 384, points: 5, cost: c(0,0,3,0,3,1), bonus: 'black' as const },
  ];

  for (const def of legendaryDefs) {
    cards.push({
      id: generateCardId(),
      name: def.name,
      level: 'legendary',
      points: def.points,
      cost: def.cost,
      bonus: def.bonus,
      bonusCount: 2,
      image: spriteUrl(def.spriteId),
    });
  }

  return cards;
}
