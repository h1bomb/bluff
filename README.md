<p align="center">
  <img src="./docs/assets/logo.png" alt="BLUFF Logo" width="140" style="border-radius: 16px;" />
</p>

# <p align="center">🃏 BLUFF</p>

<p align="center">
  <strong>AI can't read your cards.</strong><br/>
  <em>A Cyber-Roguelike Poker Duel with Cognitive AI & Autopilot</em>
</p>

<p align="center">
  English | <a href="./README_zh.md">简体中文</a>
</p>

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

<p align="center">
  <img src="./docs/assets/screenshot_1.png" alt="BLUFF Gameplay & JEV Autopilot Cockpit" width="100%" />
</p>

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

### 🔑 Environment Variables & Third-Party OAuth Setup

BLUFF supports **Google** and **GitHub** third-party authentication, storing user profiles and game run replays in a cloud PostgreSQL database (such as [Neon](https://neon.tech)).

Copy the environment template:
```bash
cp .env.example .env.local
```

Edit `.env.local` with the following variables:

| Variable | Requirement | Description | How to Obtain / Example |
|----------|-------------|-------------|-------------------------|
| `DATABASE_URL` | Recommended | PostgreSQL connection string | Obtained from [Neon](https://neon.tech), e.g. `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `AUTH_SECRET` | Required | NextAuth session encryption secret | Run `openssl rand -base64 32` or `npx auth secret` in your terminal |
| `AUTH_GOOGLE_ID` | Optional* | Google OAuth Client ID | From [Google Cloud Console](https://console.cloud.google.com/) OAuth 2.0 Web Application |
| `AUTH_GOOGLE_SECRET` | Optional* | Google OAuth Client Secret | Same as above |
| `AUTH_GITHUB_ID` | Optional* | GitHub OAuth Client ID | From [GitHub Developer Settings](https://github.com/settings/developers) OAuth App |
| `AUTH_GITHUB_SECRET` | Optional* | GitHub OAuth Client Secret | Same as above |
| `TYPESAFE_API_KEY` | Optional | TypeSafe AI API Key | From [TypeSafe AI](https://typesafe.ai) for LLM-powered opponent analysis |

*\* Note: To enable a specific sign-in provider, provide both its ID and Secret.*

#### 🌐 Important: Authorized Redirect / Callback URLs

When registering your OAuth application in the Google and GitHub developer consoles, set the **Authorization callback URL** to:

- **Local Development**:
  - Google: `http://localhost:3000/api/auth/callback/google`
  - GitHub: `http://localhost:3000/api/auth/callback/github`
- **Vercel Production**:
  - Google: `https://<your-project>.vercel.app/api/auth/callback/google`
  - GitHub: `https://<your-project>.vercel.app/api/auth/callback/github`

#### 📦 Initialize Database Schema
After setting `DATABASE_URL`, synchronize the 5 Prisma tables (`User`, `Account`, `Session`, `VerificationToken`, `GameRun`) to your database:
```bash
pnpm prisma db push
```

> 📖 **Full Guide**: For detailed step-by-step instructions (including Google OAuth Consent Screen configuration, Vercel deployments, account linking, and log diagnostics), see [Vercel Deployment & OAuth Setup Guide](./docs/vercel-deployment.md).

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
