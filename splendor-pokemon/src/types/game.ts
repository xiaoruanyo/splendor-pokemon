// ============ 核心类型定义 ============

export type TokenColor = 'red' | 'blue' | 'black' | 'pink' | 'yellow' | 'purple';
export type CardLevel = 1 | 2 | 3 | 'rare' | 'legendary';
export type GamePhase = 'setup' | 'playing' | 'evolution' | 'last_round' | 'finished';
export type GameMode = 'solo' | 'local';
export type AIDifficulty = 'easy' | 'medium';

export const TOKEN_COLORS: TokenColor[] = ['red', 'blue', 'black', 'pink', 'yellow'];
export const ALL_COLORS: TokenColor[] = ['red', 'blue', 'black', 'pink', 'yellow', 'purple'];

export const MASTER_BALL_TOTAL = 5;
export const BASIC_TOKEN_TOTAL = 7;
export const MAX_TOKENS = 10;
export const MAX_RESERVED = 3;
export const WIN_SCORE = 18;

export const TOKEN_COUNT_BY_PLAYERS: Record<number, number> = { 2: 4, 3: 5, 4: 7 };

export const TOKEN_NAMES: Record<TokenColor, string> = {
  red: '精灵球', blue: '超级球', black: '高级球', pink: '治愈球', yellow: '快速球', purple: '大师球',
};

export const TOKEN_EMOJI: Record<TokenColor, string> = {
  red: '🔴', blue: '🔵', black: '⚫', pink: '🩷', yellow: '🟡', purple: '🟣',
};

export const TOKEN_IMG: Record<TokenColor, string> = {
  red: '/assets/ui/token-red.png',
  blue: '/assets/ui/token-blue.png',
  black: '/assets/ui/token-black.png',
  pink: '/assets/ui/token-pink.png',
  yellow: '/assets/ui/token-yellow.png',
  purple: '/assets/ui/token-purple.png',
};

export const UI_ASSETS = {
  boardBg: '/assets/ui/board-bg.jpg',
  cardBack: '/assets/ui/card-back.png',
  logo: '/assets/ui/logo.png',
  homeBg: '/assets/ui/home-bg.jpg',
  panelBg: '/assets/ui/panel-bg.png',
  token: TOKEN_IMG,
} as const;

export const TRAINERS = [
  { id: 'ash', name: '小智', emoji: '🧢', color: '#3B7BBD' },
  { id: 'misty', name: '小霞', emoji: '💧', color: '#F4A6B8' },
  { id: 'brock', name: '小刚', emoji: '🪨', color: '#8B7355' },
  { id: 'rocket', name: '火箭队', emoji: '🚀', color: '#EE3B33' },
] as const;

export interface TokenCost {
  [key: string]: number;
  red: number; blue: number; black: number; pink: number; yellow: number; purple: number;
}

export const ZERO_COST: TokenCost = { red: 0, blue: 0, black: 0, pink: 0, yellow: 0, purple: 0 };

export interface PokemonCard {
  id: string;
  name: string;
  level: CardLevel;
  points: number;
  cost: TokenCost;
  bonus: TokenColor;          // 永久奖励颜色
  bonusCount: number;         // 奖励数量 (1 for normal, 2 for rare/legendary)
  evolutionOf?: string;       // 进化自哪个宝可梦
  evolutionReq?: TokenCost;   // 进化需求
  evolutionOfImage?: string;  // 基础形态的图片URL
  image?: string;             // sprite URL
}

export interface PlayerState {
  id: string;
  name: string;
  trainer: string;
  trainerEmoji: string;
  tokens: Record<TokenColor, number>;
  ownedCards: PokemonCard[];
  reservedCards: PokemonCard[];
  score: number;
  evolutionCount: number;
  bonuses: Record<TokenColor, number>;  // 汇总永久奖励
  isAI: boolean;
  aiDifficulty?: AIDifficulty;
}

export interface BoardState {
  decks: Record<CardLevel, PokemonCard[]>;
  revealed: Record<CardLevel, PokemonCard[]>;
  rareRevealed: PokemonCard | null;
  legendaryRevealed: PokemonCard | null;
}

export interface GameState {
  gameId: string;
  mode: GameMode;
  players: PlayerState[];
  board: BoardState;
  tokenSupply: Record<TokenColor, number>;
  currentPlayerIndex: number;
  phase: GamePhase;
  turnNumber: number;
  lastRoundTriggered: boolean;
  lastRoundStartPlayer: number;
  winner: PlayerState | null;
  rankings: PlayerState[];
}

export type ActionType = 'take_3_diff' | 'take_2_same' | 'buy_board' | 'buy_reserved' | 'reserve_board' | 'reserve_deck' | 'evolve' | 'pass';

export interface GameAction {
  type: ActionType;
  playerId: string;
  cardId?: string;
  source?: 'board' | 'reserved';
  fromLevel?: CardLevel;
  tokens?: Partial<Record<TokenColor, number>>;
  payment?: Partial<Record<TokenColor, number>>;
  evolveFrom?: string;
  evolveTo?: string;
}

export interface Evolution {
  from: PokemonCard;
  to: PokemonCard;
}
