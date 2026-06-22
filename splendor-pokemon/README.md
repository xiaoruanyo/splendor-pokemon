# 璀璨宝石：宝可梦 — 前端项目

> React + TypeScript + Vite 实现，包含完整游戏引擎和 AI 对手。

---

## 开发命令

```bash
# 安装依赖
npm install

# 启动前端开发服务器（默认 http://localhost:5173）
npm run dev

# 局域网可访问（方便手机/平板联机测试）
npm run dev -- --host 0.0.0.0

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint
```

---

## 架构概览

```
src/
├── components/       # React UI 层（页面 + 组件）
│   ├── HomeScreen.tsx         # 首页：选择单机/在线模式
│   ├── GameScreen.tsx         # 单人/本地游戏主界面
│   ├── OnlineGameScreen.tsx   # 在线对战界面
│   ├── LobbyScreen.tsx        # 在线大厅（房间列表、创建/加入房间）
│   ├── LoginScreen.tsx        # 用户登录/注册
│   └── GameOverModal.tsx      # 游戏结束结算弹窗
│
├── engine/           # 游戏逻辑引擎（纯 TypeScript，无 DOM 依赖）
│   ├── game.ts               # 游戏主控：初始化、行动执行、回合流转
│   ├── validator.ts          # 行动合法性校验
│   ├── evolution.ts          # 进化条件检查 + 执行
│   └── card.ts               # 费用计算、可负担性检查
│
├── ai/               # AI 对手
│   └── aiPlayer.ts           # 多难度 AI（easy/medium/hard）
│
├── store/            # Zustand 状态管理
│   └── gameStore.ts          # 游戏全部状态 + 操作
│
├── network/          # 后端通信
│   ├── api.ts                # REST API（登录、房间 CRUD）
│   └── socket.ts             # Socket.IO（在线对战实时通信）
│
├── data/             # 静态数据
│   └── cards.ts              # 90 张宝可梦卡牌完整定义
│
└── types/            # TypeScript 类型
    └── game.ts               # 全部游戏类型 + 常量
```

### 设计原则

- **逻辑与 UI 分离**：`engine/` 是纯逻辑层，不依赖 React/DOM，可独立测试
- **单向数据流**：UI → store action → engine → 新 state → UI 更新
- **命令模式**：每个玩家行动封装为独立 action，天然支持日志/回放

---

## 游戏引擎 API

引擎层导出纯函数，无副作用：

### 创建游戏

```typescript
import { createInitialState } from './engine/game';

const game = createInitialState('solo', [
  { name: '玩家', trainer: 'ash', trainerEmoji: '🧢', isAI: false },
  { name: '小智 AI', trainer: 'ash', trainerEmoji: '🧢', isAI: true, aiDifficulty: 'medium' },
]);
```

### 执行行动

```typescript
import { take3Diff, take2Same, buyCard, reserveCard, evolve, endTurn } from './engine/game';

// 拿3个不同精灵球
const result = take3Diff(game, playerId, ['red', 'blue', 'yellow']);

// 购买卡牌（source: 'board' 或 'reserved'）
const result = buyCard(game, playerId, cardId, 'board', { red: 1, blue: 2 });

// 进化宝可梦
const result = evolve(game, playerId, fromCardId, toCardId);
```

### 校验行动

```typescript
import { validateTake3Diff, validateTake2Same, validateBuyCard } from './engine/validator';

const error = validateTake3Diff(game, player, selectedTokens);
if (error) { /* 行动不合法 */ }
```

---

## 与后端通信

### 开发模式（Vite 代理）

Vite 自动将 `/api` 和 `/socket.io` 请求代理到 `http://localhost:3001`：

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3001', changeOrigin: true, ws: true },
    },
  },
});
```

### 生产模式

生产环境需配置 Nginx 反向代理（见根目录 [README.md](../README.md#部署指南)）。

---

## 游戏模式说明

### 1. 单机模式（Solo）

- 全程浏览器内完成，无需后端
- 随机洗牌、AI 对手在浏览器内运行
- AI 可设置 easy/medium/hard 难度

### 2. 本地热座

- 2-4 人在同一浏览器轮流操作
- 无需后端，纯前端

### 3. 在线对战

- 需要后端服务运行
- 创建/加入房间，与好友对战
- 通过 Socket.IO 实时同步游戏状态

---

## 扩展卡牌

卡牌数据在 `src/data/cards.ts`，按图鉴编号引用 `public/assets/pokemon/` 下的 PNG 图片。

参数含义：

```typescript
{
  id: 'card_001',         // 唯一标识
  name: '妙蛙种子',        // 宝可梦中文名
  level: 1,               // 1=初级, 2=中级, 3=高级, rare=稀有, legendary=传说
  points: 1,              // 胜利点数
  cost: { red: 0, blue: 3, black: 0, pink: 1, yellow: 0, purple: 0 },  // 购买费用
  bonus: 'blue',          // 永久奖励颜色
  bonusCount: 1,          // 奖励数量（稀有/传说为 2）
  evolutionOf: null,      // 进化自哪只宝可梦（进化形态填前一级的 name）
  evolutionRequirement: null, // 进化条件（进化形态才有）
  imageUrl: 'assets/pokemon/1.png',  // 卡图路径
  nationalNo: 1,          // 全国图鉴编号
  type: 'grass',          // 属性
}
```

---

## 相关文档

- [项目总览和部署指南](../README.md)
- [产品需求文档](../docs/requirements.md) — 完整游戏规则
- [技术设计文档](../docs/technical-design.md) — 架构设计细节
- [美术素材生成指南](./docs/art-assets.md) — AI 生成 UI 素材
