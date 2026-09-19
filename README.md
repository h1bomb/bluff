# 🃏 BLUFF

> **AI can't read your cards.**

English | [简体中文](./README_zh.md)

---

## About

**BLUFF** is a strategic card game that blends **poker dueling** with **roguelike deckbuilding**. Your opponent is an AI that analyzes your behavioral patterns in real time — outsmart it through clever bluffing, shatter its cognitive model, earn powerful upgrades, and build an unstoppable scoring engine.

### ✨ Key Features

- 🎭 **Bluffing Mechanic** — Deceive the AI with weak hands to trigger the "Model Break" system
- 🤖 **AI Psychological Warfare** — AI uses a heuristic engine + LLM to analyze your behavioral intent in real time
- 🃏 **Roguelike Deckbuilding** — Balatro-inspired Ante/Blind progression with Jokers, Buffs, and upgrades
- 🎰 **Dual Modes** — Classic 5-hand poker duel & deep roguelike mode
- 🔑 **OAuth & Cloud Database** — Google & GitHub third-party login, with run records and full replays persisted in PostgreSQL
- 🚀 **Vercel Ready** — Built for serverless deployment out of the box
- 🌏 **Bilingual** — Full Chinese and English localization
- 🕹️ **Pixel Art Style** — Retro CRT terminal aesthetic
- 🤖 **Autopilot** — Built-in AI Autopilot mode with automated play and stat tracking

---

## Screenshots

> _(Coming soon)_

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/h1bomb/bluff.git
cd bluff

# Install dependencies
pnpm install

# Configure environment variables (optional, for AI model features)
cp .env.example .env.local
```

### Configure JEV AI Key (Optional)

Edit `.env.local` and add your [TypeSafe AI](https://typesafe.ai) API Key:

```bash
TYPESAFE_API_KEY=your_api_key_here
```

> [!NOTE]
> This key is **optional**. If not configured or if the API call times out (>1200ms), the system automatically and seamlessly falls back to the built-in **Heuristic Decision Engine (HeuristicDecisionProvider)**. The game works perfectly fine without it.
>
> When configured, the AI opponent uses an LLM for deeper behavioral analysis, providing a more challenging gameplay experience.

### Run

```bash
# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to start playing.

### Build

```bash
pnpm build
pnpm start
```

### Test

```bash
pnpm test
```

---

## Game Modes

### 🎴 Classic Mode

A best-of-5 poker duel. Use Fold / Call / Raise / All-In against the AI. Successfully bluffing triggers a Model Break, reducing the AI's understanding of your play style.

### 🎰 Roguelike Mode

A Balatro-style roguelike mode:

- **8 Antes**, each with Small Blind, Big Blind, and Boss Blind
- **Select and play cards** to build poker hands and accumulate score to beat the target
- **Shop system** to purchase Jokers, hand upgrade scrolls, and memory mods (card modifiers)
- **Boss battles** with special abilities and restrictions
- **Endless mode** — exponentially scaling challenges after Ante 8

---

## Core Systems

| System | Description |
|--------|-------------|
| **Model Break** | Triggered by successfully deceiving the AI; earn rewards and choose a Buff |
| **Joker System** | 18 psychology-themed Jokers across 4 rarities, triggering scoring bonuses |
| **Buff System** | False Tell, Memory Poison, Counter Read, Mind Read — manipulate AI perception |
| **Scoring Engine** | Chips × Mult × Cognitive Mult, with card modifiers and Joker synergies |
| **Shop** | Buy Jokers, upgrade hand types, and modify cards between rounds |
| **AI Engine** | Heuristic rule engine + TypeSafe AI SDK (LLM) dual-layer decision system |

---

## 📖 Game Documentation

For detailed game guides and deployment instructions, see:

- 🚀 [Vercel Deployment & OAuth Setup Guide](./docs/vercel-deployment.md)
- 📖 [Game Guide (English)](./docs/game-guide-en.md)
- 📖 [游戏说明 (中文)](./docs/game-guide-zh.md)

---

## Tech Stack

| Technology | Version |
|-----------|---------|
| [Next.js](https://nextjs.org) | 16.3 |
| [React](https://react.dev) | 19.2 |
| [Auth.js / NextAuth](https://authjs.dev) | 5.0 (Beta) |
| [Prisma ORM](https://www.prisma.io) | 6.x |
| [PostgreSQL](https://www.postgresql.org) | Neon / Supabase |
| [TypeScript](https://www.typescriptlang.org) | 5.x |
| [Zustand](https://zustand.docs.pmnd.rs) | 5.x |
| [Tailwind CSS](https://tailwindcss.com) | 4.x |
| [shadcn/ui](https://ui.shadcn.com) | Latest |
| [Radix UI](https://www.radix-ui.com) | Latest |
| [@typesafe-ai/sdk](https://typesafe.ai) | 0.6 |
| [Vitest](https://vitest.dev) | 5.x |

---

## Project Structure

```
bluff/
├── src/
│   ├── app/                  # Next.js page routes
│   │   ├── page.tsx          # Landing page (mode selection)
│   │   ├── game/             # Main game page
│   │   ├── history/          # Game history
│   │   └── api/              # API routes
│   ├── components/           # React components
│   │   ├── game/             # Game-related components
│   │   ├── history/          # History components
│   │   └── ui/               # shadcn/ui components
│   ├── game/                 # Core game engine
│   │   ├── engine/           # Classic & Roguelike engines
│   │   ├── poker/            # Hand evaluators
│   │   ├── scoring/          # Scoring system
│   │   ├── jokers/           # Joker definitions & logic
│   │   ├── buffs/            # Buff definitions & engine
│   │   ├── shop/             # Shop system
│   │   ├── ai/               # AI decision providers
│   │   └── patterns/         # Behavioral pattern extraction
│   ├── jev/                  # AI Cognitive Analysis Engine (JEV)
│   ├── store/                # Zustand state management
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities & i18n
│   └── services/             # API service layer
├── tests/                    # Test files
├── docs/                     # Game documentation
└── public/                   # Static assets
```

---

## Development

```bash
# Run development server
pnpm dev

# Run tests
pnpm test

# Lint code
pnpm lint

# Build for production
pnpm build
```

---

## License

This is a private project.

---

> 🎲 **In the world of BLUFF, the strongest hand doesn't always win — the best liar does.**
