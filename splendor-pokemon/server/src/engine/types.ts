// ============ 共享游戏类型（服务端权威版本） ============

export type TokenColor = 'red' | 'blue' | 'black' | 'pink' | 'yellow' | 'purple';
export type CardLevel = 1 | 2 | 3 | 'rare' | 'legendary';
export type GamePhase = 'setup' | 'playing' | 'evolution' | 'last_round' | 'finished';

export const TOKEN_COLORS: TokenColor[] = ['red', 'blue', 'black', 'pink', 'yellow'];
export const ALL_COLORS: TokenColor[] = ['red', 'blue', 'black', 'pink', 'yellow', 'purple'];

export const MASTER_BALL_TOTAL = 5;
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
  bonus: TokenColor;
  bonusCount: number;
  evolutionOf?: string;
  evolutionReq?: TokenCost;
  image?: string;
}

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  userId?: string;       // 关联的 User ID（在线模式）
  tokens: Record<TokenColor, number>;
  ownedCards: PokemonCard[];
  reservedCards: PokemonCard[];
  score: number;
  evolutionCount: number;
  bonuses: Record<TokenColor, number>;
  isConnected: boolean;
}

export interface BoardState {
  decks: Record<CardLevel, PokemonCard[]>;
  revealed: Record<CardLevel, PokemonCard[]>;
  rareRevealed: PokemonCard | null;
  legendaryRevealed: PokemonCard | null;
}

export interface GameState {
  gameId: string;
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

export type ActionType = 'take_3_diff' | 'take_2_same' | 'buy_board' | 'buy_reserved'
  | 'reserve_board' | 'reserve_deck' | 'evolve' | 'pass';

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

export interface RoomInfo {
  roomId: string;
  hostId: string;
  players: { id: string; name: string; avatar: string; userId?: string; ready: boolean }[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
}
