# 快速加入

首页新增独立的“快速加入”入口。原有账号登录、单机、本地热座入口继续保留。

流程：选择 8 款训练家头像之一 → 填写 1–16 字昵称 → 创建六位数字房间码或输入朋友的房间码 → 准备 → 房主开始。支持 2–4 人。访客房间与账号房间分开，不写入账号战绩。昵称仅用于显示，服务端按连接识别玩家，不信任客户端提供的账号身份。

访客模式当前为临时会话，刷新或断线后需要重新加入等待中的房间；进行中的对局尚不支持断线恢复。服务重启会清空内存中的房间。

## 运行与测试

前端：在项目根目录运行 `npm run dev -- --host 127.0.0.1`。

后端：在 `server` 目录完成依赖安装与 `npx prisma generate`，运行 `npm run dev`。前端通过 Vite 将 API / Socket 请求转发至本地 3001 端口。正式环境需同时部署前后端及头像文件。

访客功能不要求注册、邀请码或数据库记录；账号登录和战绩仍需要原有数据库配置。

验证：前后端构建；两浏览器访客建房、加入、准备、开局；手机布局；昵称与头像校验；房间容量、房主移交、开始权限；真实游戏拿球操作；原 JWT 账号入口。后端回归命令：`node node_modules/tsx/dist/cli.mjs tests/quick-play.ts`。

## 头像

最终素材位于 `public/assets/trainers/*.webp`，均为 192×192；8 张合计 61,698 字节，单张约 5–9 KB。原始生成大图不用于网页请求。

使用内置 imagegen 生成原创宝可梦训练家风格头像，再按用户要求缩小并压缩为 WebP。生成提示词如下。

Forest: Create a single square game profile avatar, original Pokemon-inspired young adult forest trainer, short dark hair, green explorer jacket and cream cap, warm confident smile, centered head and shoulders, polished Japanese adventure anime cel shading, sage green flat background, face large legible at 64px, no text no logos no border.

Ocean: Single square game avatar original Pokemon-inspired young adult female ocean trainer, short wavy navy hair, turquoise sports jacket, diving goggles resting on head, friendly bright smile, centered head and shoulders face large, clean Japanese adventure anime cel shading, pale ocean blue flat background, legible at 64px, no text no logos no border.

其他六张的模板：Single square small game profile avatar, original Pokemon-inspired young adult {theme}. Centered large face head and shoulders, friendly confident smile, clean Japanese adventure anime cel shading, bold simple shapes optimized for 64px display, no text logos border. One character only.

- flame: male fire trainer with spiky auburn hair, red scarf, orange background
- electric: female electric trainer with golden ponytail, black sporty jacket, yellow background
- moon: androgynous moon trainer with lavender bob hair, violet cape collar, purple background
- rock: male mountain trainer with tan skin, brown curly hair, khaki hiking vest, warm sandstone background
- ice: female ice trainer with silver braid and blue winter cap, pale icy blue background
- flower: female flower trainer with pink hair, white sunhat and flower clip, soft rose background
