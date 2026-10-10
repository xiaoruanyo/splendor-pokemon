export const TRAINER_AVATARS = [
  { id: 'forest', name: '森林探索家', emoji: '/assets/trainers/forest.webp', color: '#518b76' },
  { id: 'ocean', name: '海洋冒险家', emoji: '/assets/trainers/ocean.webp', color: '#518b76' },
  { id: 'flame', name: '火焰挑战者', emoji: '/assets/trainers/flame.webp', color: '#518b76' },
  { id: 'electric', name: '闪电追逐者', emoji: '/assets/trainers/electric.webp', color: '#518b76' },
  { id: 'moon', name: '月夜旅人', emoji: '/assets/trainers/moon.webp', color: '#518b76' },
  { id: 'rock', name: '山岳攀登者', emoji: '/assets/trainers/rock.webp', color: '#518b76' },
  { id: 'ice', name: '冰原行者', emoji: '/assets/trainers/ice.webp', color: '#518b76' },
  { id: 'flower', name: '花园伙伴', emoji: '/assets/trainers/flower.webp', color: '#518b76' },
] as const;
const legacy: Record<string, string> = {
 '🧢': 'forest', '💧': 'ocean', '🪨': 'rock', '🚀': 'flame', '🎩': 'moon',
 '🎀': 'flower', '👒': 'flower', '🔥': 'flame', '⚡': 'electric', '🌿': 'forest', '👻': 'moon',
};
export function resolveAvatar(avatar?: string): string {
 return TRAINER_AVATARS.find(a => a.emoji === avatar)?.emoji
   || `/assets/trainers/${legacy[avatar || ''] || 'forest'}.webp`;
}
