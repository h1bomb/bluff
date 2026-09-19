# 🃏 BLUFF

> **AI读不懂你的牌。**

[English](./README.md) | 简体中文

---

## 简介

**BLUFF** 是一款融合了 **扑克对战** 与 **Roguelike** 元素的策略卡牌游戏。你的对手是一个实时分析你行为模式的 AI——通过巧妙的虚张声势击溃它的认知模型，获取强力增益，构建无敌的计分引擎。

### ✨ 核心特色

- 🎭 **虚张声势机制** — 用弱牌欺骗 AI，触发 "Model Break" 击溃系统
- 🤖 **AI 心理博弈** — AI 使用启发式引擎 + LLM 实时分析你的行为意图
- 🃏 **Roguelike 构筑** — 受 Balatro 启发的 Ante/Blind 进阶系统，收集 Joker、Buff 和升级
- 🎰 **双模式** — 经典5局扑克对决 & 深度肉鸽模式
- 🔑 **三方登录与云存档** — 支持 Google 与 GitHub 登录，战局记录与回放跨端持久化存储于 PostgreSQL 数据库
- 🚀 **Vercel 一键托管** — 原生适配 Serverless 架构，开箱即用部署
- 🌏 **中英双语** — 完整的国际化支持
- 🕹️ **像素风格** — 复古 CRT 终端美学
- 🤖 **自动驾驶** — 内置 AI Autopilot 模式，可自动对局并追踪统计

---

## 截图

> _（开发中）_

---

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 10+

### 安装

```bash
# 克隆仓库
git clone https://github.com/h1bomb/bluff.git
cd bluff

# 安装依赖
pnpm install

# 配置环境变量（可选，用于 AI 模型功能）
cp .env.example .env.local
```

### 配置 JEV AI 密钥（可选）

编辑 `.env.local`，填入你的 [TypeSafe AI](https://typesafe.ai) API Key：

```bash
TYPESAFE_API_KEY=your_api_key_here
```

> [!NOTE]
> 此密钥为 **可选配置**。如果未配置或 API 调用超时（>1200ms），系统会自动无缝回退到内置的 **启发式决策引擎 (HeuristicDecisionProvider)**，游戏仍可正常运行。
>
> 配置后，AI 对手将使用 LLM 进行更深层的行为分析，提供更具挑战性的对局体验。

### 运行

```bash
# 启动开发服务器
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 开始游戏。

### 构建

```bash
pnpm build
pnpm start
```

### 测试

```bash
pnpm test
```

---

## 游戏模式

### 🎴 经典模式

5 局制扑克对决。通过 弃牌 / 跟注 / 加注 / 全下 与 AI 博弈，成功虚张声势可触发 Model Break，降低 AI 理解度。

### 🎰 肉鸽模式

Balatro 风格的 Roguelike 模式：

- **8 个 Ante**，每个包含小盲注、大盲注和 Boss 盲注
- **选牌出牌**打出牌型累积分数，达到目标分数击败盲注
- **商店系统**购买 Joker、牌型升级卷轴与记忆修改器（卡牌修饰）
- **Boss 战**拥有特殊能力的 Boss 盲注
- **无尽模式** — Ante 8 之后进入指数级增长的无尽挑战

---

## 核心系统

| 系统 | 说明 |
|------|------|
| **Model Break** | 成功欺骗 AI 后触发，获得奖励和 Buff 选择权 |
| **Joker 系统** | 18 种心理学主题 Joker，4 种稀有度，在计分时触发各种加成 |
| **Buff 系统** | 假动作、记忆毒素、反读术、读心术 — 操控 AI 感知 |
| **计分引擎** | 筹码 × 倍率 × 认知倍率，支持卡牌修饰器和 Joker 联动 |
| **商店** | 回合间购买 Joker、升级牌型、改造卡牌 |
| **AI 引擎** | 启发式规则引擎 + TypeSafe AI SDK (LLM) 双重决策 |

---

## 📖 游戏文档
 
详细的游戏说明与部署文档请查看：

- 🚀 [Vercel 部署与第三方登录配置指南](./docs/vercel-deployment.md)
- 📖 [游戏说明 (中文)](./docs/game-guide-zh.md)
- 📖 [Game Guide (English)](./docs/game-guide-en.md)

---

## 技术栈

| 技术 | 版本 |
|------|------|
| [Next.js](https://nextjs.org) | 16.3 |
| [React](https://react.dev) | 19.2 |
| [Auth.js / NextAuth](https://authjs.dev) | 5.0 (Beta) |
| [Prisma ORM](https://www.prisma.io) | 6.x |
| [PostgreSQL](https://www.postgresql.org) | Neon / Supabase |
| [TypeScript](https://www.typescriptlang.org) | 5.x |
| [Zustand](https://zustand.docs.pmnd.rs) | 5.x |
| [Tailwind CSS](https://tailwindcss.com) | 4.x |
| [shadcn/ui](https://ui.shadcn.com) | 最新 |
| [Radix UI](https://www.radix-ui.com) | 最新 |
| [@typesafe-ai/sdk](https://typesafe.ai) | 0.6 |
| [Vitest](https://vitest.dev) | 5.x |

---

## 项目结构

```
bluff/
├── src/
│   ├── app/                  # Next.js 页面路由
│   │   ├── page.tsx          # 首页（模式选择）
│   │   ├── game/             # 游戏主页面
│   │   ├── history/          # 历史记录
│   │   └── api/              # API 路由
│   ├── components/           # React 组件
│   │   ├── game/             # 游戏相关组件
│   │   ├── history/          # 历史记录组件
│   │   └── ui/               # shadcn/ui 组件
│   ├── game/                 # 游戏核心引擎
│   │   ├── engine/           # 经典 & 肉鸽引擎
│   │   ├── poker/            # 牌型评估器
│   │   ├── scoring/          # 计分系统
│   │   ├── jokers/           # Joker 定义与逻辑
│   │   ├── buffs/            # Buff 定义与引擎
│   │   ├── shop/             # 商店系统
│   │   ├── ai/               # AI 决策提供器
│   │   └── patterns/         # 行为模式提取
│   ├── jev/                  # AI 认知分析引擎 (JEV)
│   ├── store/                # Zustand 状态管理
│   ├── hooks/                # React 自定义 Hooks
│   ├── lib/                  # 工具库 & 国际化
│   └── services/             # API 服务层
├── tests/                    # 测试文件
├── docs/                     # 游戏文档
└── public/                   # 静态资源
```

---

## 开发

```bash
# 运行开发服务器
pnpm dev

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 构建生产版本
pnpm build
```

---

## 许可证

本项目为私有项目。

---

> 🎲 **在 BLUFF 的世界里，最强的牌不一定能赢——最好的骗子才能。**
