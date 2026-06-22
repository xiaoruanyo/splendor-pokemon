# 璀璨宝石宝可梦 Web 游戏 — 技术设计文档

> **版本**: v1.0  
> **日期**: 2026-06-16  
> **对应 PRD**: [requirements.md](./requirements.md)

---

## 目录

1. [技术选型](#1-技术选型)
2. [系统架构](#2-系统架构)
3. [前端架构](#3-前端架构)
4. [后端架构](#4-后端架构)
5. [数据模型](#5-数据模型)
6. [游戏状态机](#6-游戏状态机)
7. [核心算法](#7-核心算法)
8. [API 设计](#8-api-设计)
9. [WebSocket 协议](#9-websocket-协议)
10. [AI 设计](#10-ai-设计)
11. [性能优化](#11-性能优化)
12. [部署方案](#12-部署方案)

---

## 1. 技术选型

### 1.1 总体策略

- **优先单人/本地模式可离线运行**（V1.0 MVP 无需后端）
- **渐进增强**：V1.0 纯前端 → V1.1 加入后端 → V2.0 完整全栈
- **组件化开发**，便于复用和测试

### 1.2 前端技术栈

| 类别 | 技术 | 版本 | 选型理由 |
|------|------|------|---------|
| 语言 | TypeScript | 5.x | 类型安全，大型项目必备 |
| 框架 | React | 18+ | 生态丰富，组件化成熟 |
| 构建工具 | Vite | 5.x | 极速 HMR，开箱即用 TS |
| 状态管理 | Zustand | 4.x | 轻量、TS 友好、无 boilerplate |
| UI 库 | Tailwind CSS | 3.x | 原子化 CSS，快速开发 |
| 动画 | Framer Motion | 10.x | 声明式动画，React 生态首选 |
| 拖拽 | @dnd-kit/core | 6.x | 现代拖拽库，可访问性好 |
| 路由 | React Router | 6.x | 标准 React 路由方案 |
| 网络 | Socket.IO Client | 4.x | WebSocket 实时通信 |
| 测试 | Vitest + React Testing Library | — | 与 Vite 集成良好 |
| 静态分析 | ESLint + Prettier | — | 代码规范 |

### 1.3 后端技术栈（V1.1+）

| 类别 | 技术 | 选型理由 |
|------|------|---------|
| 运行时 | Node.js 20+ | 与前端统一语言 |
| 框架 | Express / Fastify | 轻量 REST API |
| WebSocket | Socket.IO | 房间管理、实时通信 |
| 数据库 | PostgreSQL + Redis | 持久化 + 缓存/会话 |
| ORM | Prisma / Drizzle | 类型安全 ORM |
| 部署 | Docker + Nginx | 容器化部署 |

### 1.4 项目结构

```
splendor-pokemon/
├── client/                     # 前端项目
│   ├── public/
│   │   └── assets/             # 静态资源（卡图、精灵球图等）
│   ├── src/
│   │   ├── components/         # UI 组件
│   │   │   ├── game/           # 游戏核心组件
│   │   │   │   ├── Board.tsx           # 中央牌阵
│   │   │   │   ├── Card.tsx            # 宝可梦卡牌
│   │   │   │   ├── TokenSupply.tsx     # 精灵球供应区
│   │   │   │   ├── PlayerPanel.tsx     # 玩家面板
│   │   │   │   ├── PlayerHand.tsx      # 手牌/保留区
│   │   │   │   ├── ActionBar.tsx       # 操作按钮栏
│   │   │   │   └── EvolutionOverlay.tsx # 进化选择弹窗
│   │   │   ├── lobby/          # 大厅组件
│   │   │   ├── common/         # 通用组件
│   │   │   └── tutorial/       # 教程组件
│   │   ├── engine/             # 游戏引擎（核心逻辑，与 UI 解耦）
│   │   │   ├── Game.ts              # 游戏主控制器
│   │   │   ├── Player.ts            # 玩家状态
│   │   │   ├── Card.ts              # 卡牌逻辑
│   │   │   ├── TokenPool.ts         # 精灵球池
│   │   │   ├── actions.ts           # 行动处理器
│   │   │   ├── evolution.ts         # 进化逻辑
│   │   │   ├── scoring.ts           # 计分逻辑
│   │   │   └── validator.ts         # 行动合法性校验
│   │   ├── ai/                 # AI 对手
│   │   │   ├── AIPlayer.ts         # AI 基类
│   │   │   ├── EasyAI.ts           # 简单 AI（随机+启发）
│   │   │   ├── MediumAI.ts         # 中等 AI（贪心策略）
│   │   │   └── HardAI.ts           # 困难 AI（MCTS）
│   │   ├── network/            # 网络层
│   │   │   ├── socket.ts           # Socket.IO 客户端
│   │   │   └── api.ts              # REST API 调用
│   │   ├── store/              # 状态管理
│   │   │   ├── gameStore.ts        # 游戏状态
│   │   │   ├── lobbyStore.ts       # 大厅状态
│   │   │   └── settingsStore.ts    # 设置状态
│   │   ├── hooks/              # 自定义 Hooks
│   │   ├── utils/              # 工具函数
│   │   ├── types/              # TypeScript 类型定义
│   │   ├── data/               # 静态游戏数据（卡牌定义等）
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tests/
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                     # 后端项目（V1.1+）
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   ├── socket/
│   │   └── middleware/
│   ├── prisma/
│   └── Dockerfile
├── docs/                       # 文档
│   ├── requirements.md
│   └── technical-design.md
└── docker-compose.yml
```

---

## 2. 系统架构

### 2.1 V1.0 架构（纯前端单机模式）

```
┌───────────────────────────────────────┐
│              浏览器 (Browser)          │
│  ┌─────────────────────────────────┐  │
│  │         React Application       │  │
│  │  ┌───────────┐ ┌──────────────┐ │  │
│  │  │  UI 组件层 │ │  AI 对手模块  │ │  │
│  │  └─────┬─────┘ └──────┬───────┘ │  │
│  │        │              │         │  │
│  │  ┌─────┴──────────────┴───────┐ │  │
│  │  │      游戏引擎 (Engine)      │ │  │
│  │  │  ┌───────┐ ┌────────────┐  │ │  │
│  │  │  │ 规则   │ │  状态管理   │  │ │  │
│  │  │  │ 引擎   │ │  (Zustand) │  │ │  │
│  │  │  └───────┘ └────────────┘  │ │  │
│  │  └────────────────────────────┘ │  │
│  └─────────────────────────────────┘  │
│              localStorage              │
│         (存档/设置/统计数据)           │
└───────────────────────────────────────┘
```

### 2.2 V1.1+ 架构（全栈在线模式）

```
┌─────────────────────┐    WebSocket     ┌─────────────────────┐
│     Client A        │◄═══════════════►│                     │
│   (浏览器 React)    │                  │    Game Server      │
└─────────────────────┘                  │   (Node.js)         │
                                         │  ┌───────────────┐  │
┌─────────────────────┐                  │  │  房间管理器    │  │
│     Client B        │◄═══════════════►│  │  (Room Mgr)   │  │
│   (浏览器 React)    │                  │  └───────┬───────┘  │
└─────────────────────┘                  │          │          │
                                         │  ┌───────┴───────┐  │
┌─────────────────────┐                  │  │  游戏规则校验  │  │
│     Client C/D      │◄═══════════════►│  │  (Validator)  │  │
│   (浏览器 React)    │                  │  └───────────────┘  │
└─────────────────────┘                  │                     │
                                         │  ┌───────────────┐  │
                                         │  │  PostgreSQL   │  │
                                         │  └───────────────┘  │
                                         │  ┌───────────────┐  │
                                         │  │    Redis      │  │
                                         │  └───────────────┘  │
                                         └─────────────────────┘
```

### 2.3 设计原则

1. **游戏逻辑与 UI 完全解耦** — 引擎层无 DOM 依赖，可独立测试
2. **不可变状态** — 游戏状态使用不可变数据，便于回放和调试
3. **命令模式** — 每个玩家行动封装为 Command，支持撤销/重放
4. **事件驱动** — 游戏事件驱动 UI 更新，适合实时对战扩展

---

## 3. 前端架构

### 3.1 组件树

```
<App>
├── <Router>
│   ├── "/" → <HomePage>
│   │   ├── <GameModeSelector />      # 选择游戏模式
│   │   └── <QuickStartButton />      # 快速开始
│   │
│   ├── "/lobby" → <LobbyPage>        # (V1.1+)
│   │   ├── <RoomList />
│   │   ├── <CreateRoomPanel />
│   │   └── <MatchmakingQueue />
│   │
│   ├── "/game" → <GamePage>
│   │   ├── <TopBar>
│   │   │   ├── <RoundIndicator />    # 当前回合/阶段
│   │   │   ├── <CurrentPlayerBadge /> # 当前行动玩家
│   │   │   └── <Timer />             # 倒计时（在线模式）
│   │   │
│   │   ├── <GameBoard>
│   │   │   ├── <OpponentPanels>      # 对手信息（上方/两侧）
│   │   │   │   └── <PlayerPanel /> × (n-1)
│   │   │   │
│   │   │   ├── <CenterArea>
│   │   │   │   ├── <RareCard />      # 稀有宝可梦（1张）
│   │   │   │   ├── <LegendaryCard /> # 传说宝可梦（1张）
│   │   │   │   └── <CardGrid>        # 3×4 中央牌阵
│   │   │   │       └── <Card /> × 12
│   │   │   │
│   │   │   └── <TokenSupplyArea>     # 精灵球供应区
│   │   │       └── <TokenPile /> × 6
│   │   │
│   │   ├── <PlayerDashboard>         # 当前玩家操作区（下方）
│   │   │   ├── <ReservedCards />     # 保留卡牌（最多3张）
│   │   │   ├── <MyTokens />          # 我的精灵球
│   │   │   ├── <MyPokemon />         # 已捕获宝可梦（按颜色列排）
│   │   │   ├── <ActionBar />         # 动作按钮
│   │   │   └── <EvolutionPrompt />   # 进化提示
│   │   │
│   │   └── <GameOverModal />         # 结算弹窗
│   │
│   ├── "/tutorial" → <TutorialPage>
│   └── "/settings" → <SettingsPage>
```

### 3.2 状态管理（Zustand）

#### 游戏状态 Store

```typescript
// store/gameStore.ts

interface GameState {
  // 游戏元信息
  gameId: string | null;
  mode: 'solo' | 'local' | 'online';
  phase: 'setup' | 'playing' | 'finished';
  currentPlayerIndex: number;
  roundNumber: number;
  turnNumber: number;

  // 游戏组件
  players: PlayerState[];
  board: BoardState;
  tokenSupply: TokenPoolState;
  actionLog: GameAction[];

  // UI 状态
  selectedAction: ActionType | null;
  selectedCard: CardId | null;
  selectedTokens: TokenColor[];
  highlightedCards: CardId[];
  errorMessage: string | null;

  // 操作
  initGame: (config: GameConfig) => void;
  executeAction: (action: GameAction) => void;
  endTurn: () => void;
  checkGameEnd: () => boolean;
  resetSelection: () => void;
}
```

### 3.3 游戏引擎设计

引擎层是纯 TypeScript 类，不依赖任何 UI 框架：

```
engine/
├── Game.ts            # 游戏主控：回合流转、状态管理
├── Player.ts          # 玩家：精灵球、已拥有卡牌、保留卡、分数
├── Board.ts           # 桌面：5个牌堆 + 翻开卡牌管理
├── TokenPool.ts       # 精灵球池：数量管理、拿取校验
├── CardDeck.ts        # 牌堆：洗牌、抽牌、补充
├── Card.ts            # 单张卡牌数据结构
├── actions/
│   ├── takeTokens.ts      # 拿取精灵球
│   ├── buyCard.ts         # 捕获宝可梦
│   ├── reserveCard.ts     # 保留卡牌
│   └── evolve.ts          # 进化
├── validator.ts       # 行动合法性校验
├── cost-calculator.ts # 费用计算（含折扣）
├── evolution-checker.ts # 进化条件检查
└── scoring.ts         # 计分与终局判定
```

### 3.4 关键交互流程

#### 购买卡牌流程（示例）

```
1. 玩家点击卡牌
2. onClickCard(cardId):
   a. 计算卡牌费用
   b. 计算折扣（已拥有宝可梦的永久奖励）
   c. 计算实际需支付的精灵球
   d. 检查玩家精灵球是否足够
   e. 若足够 → 高亮卡牌 + 显示费用明细
   f. 若不足 → 卡牌置灰 + 提示不足

3. 玩家点击 [确认购买]
4. executeAction({ type: 'buy_card', cardId, payment: [...] })
   a. 引擎验证：validator.validateBuy(player, card, payment)
   b. 扣减精灵球
   c. 将卡牌移入玩家面板
   d. 从牌堆补充新卡到场上
   e. 检查是否触发进化（evolutionChecker.check(player, board)）
   f. 更新分数
   g. 检查终局条件
   h. 记录操作日志
   i. 通知 UI 更新状态

5. UI 播放购买动画
6. 如有进化可选 → 弹出进化选择界面
7. 回合结束 → 切换至下一位玩家
```

---

## 4. 后端架构（V1.1+）

### 4.1 房间管理器

```
RoomManager
├── rooms: Map<RoomId, Room>
│   ├── roomId: string
│   ├── players: PlayerConnection[]
│   ├── gameState: GameState
│   ├── settings: RoomSettings
│   └── status: 'waiting' | 'playing' | 'finished'
│
├── createRoom(config) → Room
├── joinRoom(roomId, player) → Room
├── leaveRoom(roomId, playerId)
├── startGame(roomId)
└── destroyRoom(roomId)
```

### 4.2 服务端校验要点

- **所有玩家行动必须经服务端验证**（防作弊）
- 服务端为权威状态源，客户端为乐观更新
- 校验规则与前端引擎 `validator.ts` 保持一致
- 行动日志落盘，用于纠纷仲裁

---

## 5. 数据模型

### 5.1 核心类型定义

```typescript
// types/game.ts

// ========== 卡牌 ==========
interface PokemonCard {
  id: string;
  name: string;                    // 宝可梦名称
  level: CardLevel;                // 1 | 2 | 3 | rare | legendary
  points: number;                  // 胜利点数
  cost: TokenCost;                 // 购买费用
  bonus: BonusType;                // 永久奖励（颜色）
  bonusCount: number;              // 奖励数量（通常1，稀有/传说为2）
  evolutionRequirement?: TokenCost; // 进化需求（进化链上的卡才有）
  evolutionOf?: string;            // 进化自哪张卡（进化形态才有）
  imageUrl: string;                // 卡图
}

type CardLevel = 1 | 2 | 3 | 'rare' | 'legendary';

// ========== 精灵球 ==========
type TokenColor = 'red' | 'blue' | 'black' | 'pink' | 'yellow' | 'purple';

interface TokenCost {
  red: number;
  blue: number;
  black: number;
  pink: number;
  yellow: number;
  purple: number;    // 大师球
}

// 常量定义
const TOKEN_COLORS: TokenColor[] = ['red', 'blue', 'black', 'pink', 'yellow'];
const WILD_TOKEN: TokenColor = 'purple';
const ALL_TOKEN_COLORS: TokenColor[] = [...TOKEN_COLORS, 'purple'];

const MASTER_BALL_COUNT = 5;
const BASIC_TOKEN_COUNT = 7;

const TOKEN_COUNT_BY_PLAYERS: Record<number, number> = {
  2: 4,   // 每种颜色移除3枚
  3: 5,   // 每种颜色移除2枚
  4: 7,   // 全部使用
};

const MAX_TOKENS = 10;      // 手牌精灵球上限
const MAX_RESERVED = 3;     // 保留卡牌上限
const WIN_SCORE = 18;       // 胜利分数线

const DECK_SIZES = {
  1: 40,    // 初级
  2: 30,    // 中级
  3: 10,    // 高级
  rare: 5,
  legendary: 5,
};

// ========== 游戏状态 ==========
interface GameState {
  players: PlayerState[];
  board: BoardState;
  tokenSupply: TokenPoolState;
  currentPlayerIndex: number;
  phase: GamePhase;
  turnNumber: number;
  actionLog: GameAction[];
}

interface PlayerState {
  id: string;
  name: string;
  trainer: TrainerType;            // 训练家角色
  tokens: Record<TokenColor, number>;       // 持有的精灵球
  ownedCards: PokemonCard[];                 // 已购买的宝可梦
  reservedCards: PokemonCard[];              // 保留的卡牌
  score: number;
  evolutionCount: number;                    // 进化次数
  bonuses: Record<TokenColor, number>;       // 永久奖励汇总
  isActive: boolean;
}

interface BoardState {
  decks: Record<CardLevel, CardDeckState>;
  revealed: Record<CardLevel, PokemonCard[]>;  // 每等级翻开4张
  rareRevealed: PokemonCard | null;            // 稀有宝可梦
  legendaryRevealed: PokemonCard | null;       // 传说宝可梦
}

interface CardDeckState {
  level: CardLevel;
  cards: PokemonCard[];     // 牌堆（未翻开）
  revealed: PokemonCard[];  // 翻开在场上
  discard: PokemonCard[];   // 弃牌堆（暂不使用）
}

interface TokenPoolState {
  tokens: Record<TokenColor, number>;
}

type GamePhase = 'setup' | 'playing' | 'evolution_phase' | 'finished';

// ========== 玩家行动 ==========
type GameAction =
  | TakeTokensAction
  | BuyCardAction
  | ReserveCardAction
  | EvolveAction
  | PassAction;

interface TakeTokensAction {
  type: 'take_tokens';
  playerId: string;
  tokens: Partial<Record<TokenColor, number>>;
  option: 'three_different' | 'two_same';
}

interface BuyCardAction {
  type: 'buy_card';
  playerId: string;
  cardId: string;
  source: 'board' | 'reserved';
  payment: Record<TokenColor, number>;
}

interface ReserveCardAction {
  type: 'reserve_card';
  playerId: string;
  cardId: string;
  source: 'board' | 'deck_top';
  fromLevel?: CardLevel;  // 从哪个牌堆顶部暗抽
}

interface EvolveAction {
  type: 'evolve';
  playerId: string;
  fromCardId: string;     // 基础宝可梦
  toCardId: string;       // 进化形态
}

interface PassAction {
  type: 'pass';
  playerId: string;
}
```

### 5.2 数据库表设计（V1.1+）

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- 游戏记录
CREATE TABLE game_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode VARCHAR(20) NOT NULL,     -- 'solo', 'local', 'online'
  player_count INTEGER NOT NULL,
  winner_id UUID REFERENCES users(id),
  final_scores JSONB NOT NULL,   -- [{playerId, score, evolutionCount}]
  action_count INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户统计
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  total_games INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  highest_score INTEGER DEFAULT 0,
  avg_score DECIMAL(5,2),
  rating_elo INTEGER DEFAULT 1000
);

-- 行动日志（用于回放）
CREATE TABLE action_logs (
  id BIGSERIAL PRIMARY KEY,
  game_id UUID REFERENCES game_records(id),
  turn_number INTEGER NOT NULL,
  player_id UUID REFERENCES users(id),
  action JSONB NOT NULL,
  resulting_state_hash VARCHAR(64), -- 用于状态校验
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. 游戏状态机

```
                    ┌─────────────┐
                    │   SETUP     │
                    │ 初始化游戏   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
           ┌───────│   PLAYING   │◄──────────────┐
           │       └──────┬──────┘               │
           │              │                      │
           │     ┌────────┴────────┐             │
           │     ▼                 ▼             │
           │ ┌────────┐    ┌──────────────┐      │
           │ │ 拿精灵球│    │ 捕获/保留/进化│      │
           │ └───┬────┘    └──────┬───────┘      │
           │     │                │              │
           │     └────────┬───────┘              │
           │              ▼                      │
           │    ┌──────────────────┐             │
           │    │ EVOLUTION_PHASE  │             │
           │    │ 检查可进化选项    │             │
           │    └────────┬─────────┘             │
           │              │                      │
           │              ▼                      │
           │    ┌──────────────────┐             │
           │    │   CHECK_END      │             │
           │    │  检查是否≥18分    │             │
           │    └────┬─────┬───────┘             │
           │         │     │                     │
           │    <18分 │     │ ≥18分               │
           │         │     ▼                     │
           │         │ ┌────────────┐            │
           │         │ │ LAST_ROUND │            │
           │         │ │ 最后一轮   │            │
           │         │ └─────┬──────┘            │
           │         │       │                   │
           │         │       ▼                   │
           │         │ ┌──────────────┐          │
           └─────────┘ │  FINISHED    │          │
                       │  游戏结束     │          │
                       └──────────────┘          │
```

---

## 7. 核心算法

### 7.1 费用计算（含折扣）

```typescript
// engine/cost-calculator.ts

/**
 * 计算玩家购买某张卡牌实际需要支付的精灵球
 * 已拥有的宝可梦提供的永久奖励可以抵扣等量费用
 */
function calculateActualCost(
  card: PokemonCard,
  player: PlayerState
): TokenCost {
  const actualCost: TokenCost = { ...card.cost };

  for (const color of TOKEN_COLORS) {
    // 先扣除永久奖励
    const discount = Math.min(player.bonuses[color], actualCost[color]);
    actualCost[color] -= discount;
  }

  return actualCost;
}

/**
 * 计算玩家是否负担得起某张卡牌
 */
function canAfford(card: PokemonCard, player: PlayerState): boolean {
  const actualCost = calculateActualCost(card, player);
  let wildNeeded = 0;

  for (const color of TOKEN_COLORS) {
    const shortage = Math.max(0, actualCost[color] - player.tokens[color]);
    wildNeeded += shortage;
  }

  // 大师球可以填补缺口
  return wildNeeded <= player.tokens.purple;
}
```

### 7.2 进化条件检查

```typescript
// engine/evolution-checker.ts

/**
 * 检查当前玩家可用的进化选项
 * 返回可选进化列表: [{ from: 基础卡, to: 进化卡 }]
 */
function getAvailableEvolutions(
  player: PlayerState,
  board: BoardState
): Evolution[] {
  const evolutions: Evolution[] = [];

  // 所有可见的进化形态卡牌：场上 + 保留手牌
  const visibleEvoCards = [
    ...board.revealed[1],
    ...board.revealed[2],
    ...board.revealed[3],
    ...player.reservedCards,
  ].filter(card => card.evolutionRequirement);

  for (const evoCard of visibleEvoCards) {
    // 找到该进化卡的基础形态是否在玩家已拥有卡牌中
    const baseCard = player.ownedCards.find(
      c => c.name === evoCard.evolutionOf
    );
    if (!baseCard) continue;

    // 检查玩家的奖励是否满足进化需求
    if (meetsRequirement(player.bonuses, evoCard.evolutionRequirement!)) {
      evolutions.push({ from: baseCard, to: evoCard });
    }
  }

  return evolutions;
}

function meetsRequirement(
  bonuses: Record<TokenColor, number>,
  requirement: TokenCost
): boolean {
  for (const color of ALL_TOKEN_COLORS) {
    if ((bonuses[color] || 0) < (requirement[color] || 0)) {
      return false;
    }
  }
  return true;
}
```

### 7.3 终局判定

```typescript
// engine/scoring.ts

function checkGameEnd(
  players: PlayerState[],
  currentPlayerIndex: number,
  lastRoundFlag: boolean
): GameEndResult | null {
  // 检查是否有玩家达到18分
  const triggerPlayer = players.find(p => p.score >= WIN_SCORE);

  if (triggerPlayer && !lastRoundFlag) {
    // 触发最后一轮
    return { phase: 'last_round', triggeredBy: triggerPlayer.id };
  }

  if (lastRoundFlag) {
    // 检查是否所有玩家都完成了等量回合
    // 起始玩家的上家是最后一回合的执行者
    const isLastTurn = /* 判断逻辑 */;
    if (isLastTurn) {
      // 计算最终排名
      const ranked = [...players].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.evolutionCount - a.evolutionCount; // 平手比进化次数
      });
      return { phase: 'finished', rankings: ranked };
    }
  }

  return null;
}
```

### 7.4 洗牌算法（Fisher-Yates）

```typescript
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
```

---

## 8. API 设计（V1.1+）

### 8.1 RESTful API

```
Base URL: /api/v1

# 用户
POST   /auth/login              # 登录/注册
POST   /auth/logout             # 登出
GET    /users/:id               # 用户信息
GET    /users/:id/stats         # 用户统计

# 房间
GET    /rooms                   # 房间列表
POST   /rooms                   # 创建房间
GET    /rooms/:id               # 房间详情
POST   /rooms/:id/join          # 加入房间
POST   /rooms/:id/leave         # 离开房间
POST   /rooms/:id/start         # 开始游戏

# 游戏数据
GET    /games/:id               # 游戏详情
GET    /games/:id/replay        # 游戏回放（行动日志）

# 排行榜
GET    /leaderboard             # 排行榜
```

### 8.2 主要数据结构

```typescript
// 创建房间请求
interface CreateRoomRequest {
  playerCount: 2 | 3 | 4;
  isPrivate: boolean;
}

// 创建房间响应
interface CreateRoomResponse {
  roomId: string;
  inviteCode: string;   // 邀请码，用于好友加入
}

// 排行榜条目
interface LeaderboardEntry {
  rank: number;
  username: string;
  rating: number;
  wins: number;
  totalGames: number;
  winRate: number;
}
```

---

## 9. WebSocket 协议（V1.1+）

### 9.1 事件定义

```typescript
// socket-events.ts

// Client → Server
interface ClientEvents {
  'room:create': (data: CreateRoomRequest) => void;
  'room:join': (roomId: string) => void;
  'room:leave': () => void;
  'room:ready': () => void;

  'game:action': (action: GameAction) => void;
  'game:chat': (message: string) => void;
  'game:surrender': () => void;

  'match:find': () => void;
  'match:cancel': () => void;
}

// Server → Client
interface ServerEvents {
  'room:created': (room: RoomInfo) => void;
  'room:joined': (room: RoomInfo) => void;
  'room:player_left': (playerId: string) => void;
  'room:all_ready': () => void;

  'game:started': (initialState: GameState) => void;
  'game:state_update': (update: GameStateUpdate) => void;
  'game:action_result': (result: ActionResult) => void;
  'game:your_turn': () => void;
  'game:ended': (result: GameEndResult) => void;
  'game:error': (error: GameError) => void;

  'match:found': (roomId: string) => void;
  'match:timeout': () => void;
}
```

### 9.2 消息流程：一次购买操作

```
Client                    Server
  │                         │
  │── game:action ─────────►│  (buyCard)
  │                         │── 校验合法性
  │                         │── 更新服务端状态
  │                         │── 记录日志
  │                         │
  │◄─ game:action_result ───│  { success: true }
  │◄─ game:state_update ────│  { 新的公共状态 }
  │                         │── 广播给所有玩家
  │                         │
  │◄─ game:your_turn ──────│  (下一位玩家)
```

---

## 10. AI 设计

### 10.1 分层策略

```typescript
// ai/AIPlayer.ts

abstract class AIPlayer {
  protected playerState: PlayerState;
  protected gameState: GameState;

  abstract chooseAction(): GameAction;
  abstract chooseEvolve(evolutions: Evolution[]): Evolution | null;

  // 通用工具方法
  protected getBuyableCards(): PokemonCard[] { /* ... */ }
  protected getAffordableCards(): PokemonCard[] { /* ... */ }
  protected evaluateCardValue(card: PokemonCard): number { /* ... */ }
}
```

### 10.2 EasyAI — 随机 + 简单启发

```typescript
class EasyAI extends AIPlayer {
  chooseAction(): GameAction {
    const actions: GameAction[] = [];

    // 1. 优先考虑可进化的宝可梦
    const evolutions = getAvailableEvolutions(this.playerState, this.gameState.board);
    if (evolutions.length > 0 && Math.random() < 0.7) {
      return createEvolveAction(evolutions[0]);
    }

    // 2. 随机选择：拿球、购买、保留
    const roll = Math.random();
    if (roll < 0.3) return this.randomTakeTokens();
    if (roll < 0.7) return this.randomBuy();
    return this.randomReserve();
  }
}
```

### 10.3 MediumAI — 贪心策略

```typescript
class MediumAI extends AIPlayer {
  chooseAction(): GameAction {
    // 1. 进化优先
    const evo = this.bestEvolution();
    if (evo) return createEvolveAction(evo);

    // 2. 评估所有可购买卡牌，选性价比最高的
    const buyable = this.getAffordableCards();
    if (buyable.length > 0) {
      const best = buyable.sort((a, b) =>
        this.evaluateCardValue(b) - this.evaluateCardValue(a)
      )[0];
      return createBuyAction(best);
    }

    // 3. 选择最接近能购买的卡牌，拿取对应精灵球
    // 4. 否则保留高分卡
    return this.strategicTakeOrReserve();
  }

  evaluateCardValue(card: PokemonCard): number {
    // 综合评分：分数权重 + 奖励实用性 + 是否为进化链
    return card.points * 2
      + (card.bonus === this.targetColor ? 3 : 1)
      + (card.evolutionOf ? 2 : 0);
  }
}
```

### 10.4 HardAI — 蒙特卡洛树搜索（V1.2+）

```typescript
class HardAI extends AIPlayer {
  // MCTS 参数
  private simulationsPerMove = 1000;
  private explorationConstant = 1.414; // UCB1

  chooseAction(): GameAction {
    const root = new MCTSNode(this.gameState, this.playerState.id);

    for (let i = 0; i < this.simulationsPerMove; i++) {
      // 1. Selection — UCB1 选择路径
      let node = root;
      while (node.isFullyExpanded() && !node.isTerminal()) {
        node = node.selectBestChild(this.explorationConstant);
      }

      // 2. Expansion — 扩展一个未探索行动
      if (!node.isTerminal()) {
        node = node.expand();
      }

      // 3. Simulation — 快速随机模拟到终局
      const result = node.simulate();

      // 4. Backpropagation — 回传结果
      node.backpropagate(result);
    }

    // 选择访问次数最多的子节点对应的行动
    return root.bestAction();
  }
}
```

---

## 11. 性能优化

### 11.1 前端优化

| 策略 | 说明 |
|------|------|
| 代码分割 | React.lazy + Suspense 按页面/功能分割 |
| 虚拟列表 | 卡牌列表使用虚拟滚动（若数量较大） |
| 图片懒加载 | IntersectionObserver 懒加载卡图 |
| Web Worker | AI 计算放入 Worker 避免阻塞 UI |
| Memo 优化 | React.memo / useMemo 避免不必要的重渲染 |
| Canvas 渲染 | 若 DOM 动画性能不足，考虑 Canvas/Konva |

### 11.2 后端优化

| 策略 | 说明 |
|------|------|
| 连接池 | PostgreSQL 连接池管理 |
| Redis 缓存 | 房间状态缓存，减少 DB 查询 |
| 水平扩展 | 房间服务无状态，可水平扩展 |
| 消息批处理 | Socket 消息合并发送，减少网络开销 |

### 11.3 卡图资源策略

```
方案A（推荐 MVP）：使用 SVG 占位图 + CSS 生成卡面
  - 优点：零外部依赖，加载快
  - 缺点：非官方宝可梦卡图

方案B：使用宝可梦 API (PokéAPI)
  - 优点：有官方精灵图
  - 缺点：需要转换、可能不符合卡面风格

方案C：手绘/生成风格化卡图
  - 优点：风格统一
  - 缺点：工作量大
```

---

## 12. 部署方案

### 12.1 V1.0 部署（纯前端）

```
方案：Vercel / Netlify / Cloudflare Pages
- 构建命令：npm run build
- 输出目录：client/dist
- 自定义域名：可选
- HTTPS：自动
- CDN：全球加速
```

### 12.2 V1.1+ 部署

```
docker-compose.yml:

services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: [./nginx.conf:/etc/nginx/conf.d/default.conf]

  server:
    build: ./server
    ports: ["3000:3000"]
    environment: [DATABASE_URL, REDIS_URL, JWT_SECRET]
    depends_on: [postgres, redis]

  postgres:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
```

---

> **参考来源**：  
> - [React 官方文档](https://react.dev/)  
> - [Zustand 文档](https://docs.pmnd.rs/zustand)  
> - [Framer Motion 文档](https://www.framer.com/motion/)  
> - [BoardGameArena — Splendor 实现参考](https://zh.boardgamearena.com/gamepanel?game=splendor)  
> - [GitHub — hexanome-04/splendor (Web 多人实现)](https://github.com/hexanome-04/splendor)
