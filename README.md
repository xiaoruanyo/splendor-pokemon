# 🎮 璀璨宝石：宝可梦 (Splendor: Pokémon Edition)

> 基于浏览器的 Web 在线桌游 — 收集精灵球、捕获宝可梦、进化你的队伍！

基于经典德式桌游《璀璨宝石》(Splendor) 玩法的宝可梦主题 Web 游戏。支持**单人 vs AI**、**本地热座**和**在线对战**。

---

## 📋 目录

- [快速开始](#-快速开始)
- [start-game 脚本说明](#-start-game-脚本说明)
- [项目结构](#-项目结构)
- [部署指南](#-部署指南)
- [文档索引](#-文档索引)
- [技术栈](#-技术栈)

---

## 🚀 快速开始

### 前提条件

- [Node.js](https://nodejs.org/) >= 18（推荐 20+）
- npm >= 9

### 1. 安装依赖

```bash
# 进入前端目录安装依赖
cd splendor-pokemon
npm install

# 进入后端目录安装依赖
cd server
npm install
```

### 2. 初始化数据库（后端）

```bash
cd splendor-pokemon/server
npx prisma db push
```

### 3. 启动游戏

#### 方式一：双击启动脚本（最方便）

| 平台 | 脚本 |
|------|------|
| Windows | 双击 `start-game.bat` |
| macOS / Linux | 双击或在终端执行 `start-game.sh` |

#### 方式二：手动启动

**启动后端**（在线对战需要）：
```bash
cd splendor-pokemon/server
npm run dev
# 后端运行在 http://localhost:3001
```

**启动前端**（新终端）：
```bash
cd splendor-pokemon
npm run dev -- --host 0.0.0.0
# 前端运行在 http://localhost:5173
```

### 4. 开始玩

打开浏览器访问：
- **本机**：`http://localhost:5173`
- **局域网联机**：`http://<你的IP>:5173`（手机/其他电脑可通过局域网访问）

---

## ⚡ start-game 脚本说明

根目录下的 `start-game.bat` 和 `start-game.sh` 是**一键启动前端开发服务器**的脚本。

### 它做了什么？

1. 自动切换到 `splendor-pokemon/` 目录
2. 打印游戏标题和访问地址
3. 执行 `npm run dev -- --host 0.0.0.0` 启动 Vite 开发服务器

### 关键参数 `--host 0.0.0.0`

- **不加**：只有本机能访问 `localhost:5173`
- **加上**：局域网内其他设备也能访问（比如手机、平板、室友的电脑）

### 注意事项

- ⚠️ `start-game` **只启动前端**。如果你需要登录、在线对战等功能，还需要**另外启动后端**：
  ```bash
  cd splendor-pokemon/server
  npm run dev
  ```
- 前端通过 Vite 代理将 `/api` 和 `/socket.io` 请求转发到后端（见 `vite.config.ts`），开发时无需额外配置。

### 自定义手机访问地址

脚本里写死了 `192.168.31.215` 这个 IP，你需要改成自己电脑的实际局域网 IP：

**Windows**：打开终端，输入 `ipconfig`，找 IPv4 地址。
**macOS/Linux**：打开终端，输入 `ifconfig | grep inet`。

---

## 📁 项目结构

```
myproject/
├── start-game.bat              # Windows 一键启动脚本（仅前端）
├── start-game.sh               # macOS/Linux 一键启动脚本（仅前端）
├── README.md                   # 🠔 你在这里
├── docs/                       # 项目文档
│   ├── requirements.md         # 产品需求文档（游戏规则、功能列表）
│   └── technical-design.md     # 技术设计文档（架构、数据模型、API）
└── splendor-pokemon/           # 主项目目录
    ├── package.json            # 前端依赖 + 脚本
    ├── vite.config.ts          # Vite 配置（含 API 代理）
    ├── public/                 # 静态资源
    │   └── assets/
    │       ├── pokemon/        # 宝可梦卡图（PNG，按全国图鉴编号命名）
    │       └── ui/             # UI 素材（背景、精灵球图标、Logo）
    ├── src/                    # 前端源码
    │   ├── components/         # React UI 组件
    │   │   ├── HomeScreen.tsx      # 首页
    │   │   ├── GameScreen.tsx      # 单人/本地游戏主界面
    │   │   ├── OnlineGameScreen.tsx # 在线对战界面
    │   │   ├── LobbyScreen.tsx     # 在线大厅
    │   │   ├── LoginScreen.tsx     # 登录/注册
    │   │   └── GameOverModal.tsx   # 结算弹窗
    │   ├── engine/             # 游戏引擎（纯逻辑，与 UI 无关）
    │   │   ├── game.ts             # 游戏主控：创建、行动、回合管理
    │   │   ├── card.ts             # 卡牌逻辑
    │   │   ├── validator.ts        # 行动合法性校验
    │   │   └── evolution.ts        # 进化条件检查与执行
    │   ├── ai/                 # AI 对手
    │   │   └── aiPlayer.ts         # AI 策略（easy/medium/hard）
    │   ├── store/              # Zustand 状态管理
    │   │   └── gameStore.ts        # 游戏状态 store
    │   ├── network/            # 网络层
    │   │   ├── api.ts              # REST API 调用
    │   │   └── socket.ts           # Socket.IO 客户端
    │   ├── data/               # 静态游戏数据（卡牌定义）
    │   │   └── cards.ts
    │   └── types/              # TypeScript 类型定义
    │       └── game.ts
    ├── server/                 # 后端源码
    │   ├── package.json
    │   ├── .env                # 环境变量
    │   ├── prisma/
    │   │   └── schema.prisma   # 数据库模型
    │   └── src/
    │       ├── index.ts            # 服务端入口
    │       ├── config.ts           # 配置读取
    │       ├── db.ts               # 数据库连接
    │       ├── engine/             # 服务端游戏引擎（与前端引擎镜像）
    │       ├── routes/             # REST API 路由
    │       │   ├── auth.ts         # 登录/注册
    │       │   ├── users.ts        # 用户信息
    │       │   └── admin.ts        # 管理后台（激活码生成）
    │       ├── socket/             # WebSocket 实时通信
    │       │   ├── index.ts        # Socket.IO 服务入口
    │       │   ├── room.ts         # 房间管理
    │       │   └── game.ts         # 在线对局状态同步
    │       ├── services/
    │       │   └── activation.ts   # 激活码系统
    │       └── middleware/
    │           └── auth.ts         # JWT 认证中间件
    └── docs/                   # 前端附属文档
        └── art-assets.md       # 美术素材生成指南
```

---

## 🚢 部署指南

### 开发环境（本机）

开发时只需运行两个服务：

```bash
# 终端1：前端（默认端口 5173）
cd splendor-pokemon
npm run dev -- --host 0.0.0.0

# 终端2：后端（默认端口 3001）
cd splendor-pokemon/server
npm run dev
```

前端通过 Vite proxy 自动转发 `/api` 和 `/socket.io` 到后端，**无需手动处理跨域**。

### 生产环境部署

#### 1. 构建前端

```bash
cd splendor-pokemon
npm run build
# 产出在 dist/ 目录
```

#### 2. 启动后端

```bash
cd splendor-pokemon/server

# 设置生产环境变量
export DATABASE_URL="file:./prod.db"
export JWT_SECRET="你的随机密钥"
export PORT=3001

# 推送数据库 schema
npx prisma db push

# 编译并启动
npm run build
npm run start
```

#### 3. 配置 Nginx 反向代理

```
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /path/to/splendor-pokemon/dist;
    index index.html;
    try_files $uri $uri/ /index.html;

    # 代理 API 和 WebSocket 到后端
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
    }

    location /socket.io {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### 4. 使用 Docker（快捷方式）

```bash
# 在项目根目录创建 docker-compose.yml（参考 docs/technical-design.md 第12节）
docker-compose up -d
```

---

## 📚 文档索引

| 文档 | 说明 | 适合谁看 |
|------|------|---------|
| [README.md](./README.md) | 项目总览和快速开始（你在这里） | 所有人 |
| [docs/requirements.md](./docs/requirements.md) | 产品需求：完整游戏规则、功能列表、UI 设计 | 产品/设计/玩家 |
| [docs/technical-design.md](./docs/technical-design.md) | 技术设计：架构、数据模型、API、AI 算法 | 开发者 |
| [splendor-pokemon/docs/art-assets.md](./splendor-pokemon/docs/art-assets.md) | 美术素材 AI 生成指南 | 设计师 |
| [splendor-pokemon/README.md](./splendor-pokemon/README.md) | 前端项目开发指南 | 前端开发者 |

---

## 🛠 技术栈

| 层次 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript 6 |
| 构建工具 | Vite 8 |
| 状态管理 | Zustand 5 |
| 动画 | Framer Motion 12 |
| CSS | Tailwind CSS 3 |
| 后端框架 | Express 4 + TypeScript |
| 实时通信 | Socket.IO 4 |
| 数据库 | SQLite（开发）/ PostgreSQL（生产） + Prisma ORM |
| 认证 | JWT |

---

## 🎯 当前开发状态

| 功能 | 状态 |
|------|------|
| 完整游戏规则引擎 | ✅ 已实现 |
| 单人 vs AI（简单/中等/困难） | ✅ 已实现 |
| 本地热座多人 | ✅ 已实现（同一设备轮流操作） |
| 在线对战（房间） | ✅ 已实现 |
| 用户注册/登录 | ✅ 已实现（需激活码） |
| 宝可梦进化系统 | ✅ 已实现 |
| 稀有/传说宝可梦 | ✅ 已实现 |
| 快速匹配 | 🔜 计划中 |
| 新手教程 | 🔜 计划中 |
| 音效和音乐 | 🔜 计划中 |
| 排行榜 | 🔜 计划中 |
