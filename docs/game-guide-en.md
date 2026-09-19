# 🃏 BLUFF — Game Guide

> **AI can't read your cards.**
>
> [中文版本](./game-guide-zh.md)

---

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Game Modes](#game-modes)
  - [Classic Mode](#classic-mode)
  - [Roguelike Mode](#roguelike-mode)
- [Hand Rankings](#hand-rankings)
- [Scoring System](#scoring-system)
- [Model Break](#model-break)
- [Buff System](#buff-system)
- [Joker System](#joker-system)
- [Shop System](#shop-system)
- [AI Opponent](#ai-opponent)
- [Autopilot Mode](#autopilot-mode)
- [Strategy Guide](#strategy-guide)

---

## Overview

**BLUFF** is a strategic card game that blends **poker dueling** with **roguelike deckbuilding** mechanics. Your opponent is an AI that actively tries to read your play style — your goal is to outsmart it through clever bluffing, shatter its cognitive model, and build an unstoppable scoring engine along the way.

The game offers two modes: **Classic Mode** for quick poker showdowns, and **Roguelike Mode** for deep strategic runs inspired by Balatro.

---

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Bluffing** | Betting aggressively with a weak hand to deceive the AI into thinking you're strong |
| **Model Break** | A special mechanic triggered when you successfully fool the AI, granting powerful rewards |
| **AI Understanding** | How well the AI understands your play patterns (0–100%); lower = easier to deceive |
| **Chips** | The base numerical component of scoring |
| **Mult (Multiplier)** | Multiplied with chips to produce the final score |
| **Score = Chips × Mult** | The core scoring formula in Roguelike mode |

---

## Game Modes

### Classic Mode

Classic Mode is a **best-of-5** heads-up poker duel.

#### Flow

```
Deal → Player Action → AI Analysis → AI Action → Showdown → Settlement
                         ↑                                      |
                         └──────── Repeat for 5 hands ─────────┘
```

#### Rules

1. **Deal**: You and the AI each receive a hand of cards (3-card or 5-card poker).
2. **Player Action**: Choose one of the following:
   - 🏳️ **Fold**: Surrender the hand, losing your bet.
   - 📞 **Call**: Match the current highest bet.
   - 📈 **Raise**: Increase the bet amount, pressuring the AI.
   - 💰 **All-In**: Push all your chips into the pot.
3. **AI Analysis**: The AI observes your behavioral patterns (bet timing, raise frequency, historical behavior) to infer whether you're bluffing.
4. **AI Action**: The AI makes its decision based on its analysis.
5. **Showdown**: Both sides reveal their cards and compare hand rankings.
6. **Settlement**: The winner takes the pot. If you successfully bluffed, a **Model Break** may be triggered.

#### Win Condition

After 5 hands, the side with more chips wins.

---

### Roguelike Mode

Roguelike Mode features Balatro-style strategic depth where you build a powerful scoring engine through escalating challenges.

#### Game Structure

```
Ante 1 ──→ Small Blind → Big Blind → Boss Blind ──→ Ante 2 ──→ ...
              ↓              ↓            ↓
            Shop           Shop         Shop
```

Each **Ante (round)** contains 3 **Blinds**:

| Blind Type | Description |
|-----------|-------------|
| 🔵 Small Blind | Lower target score — warm-up phase |
| 🟡 Big Blind | Medium target score — tests your build |
| 🔴 Boss Blind | High target score + special Boss abilities |

#### Gameplay Flow

1. **Draw**: Draw **8 cards** from your deck into your hand.
2. **Select & Play**: Choose up to 5 cards from your hand to play a poker hand and score points.
3. **Discard**: Alternatively, discard selected cards and draw replacements to optimize your hand.
4. **Accumulate Score**: Each played hand's score adds up. Reach the **target score** before running out of plays.
5. **Shop**: After beating a blind, visit the shop to spend money on Jokers, Hand Upgrade Scrolls, and Memory Mods.
6. **Advance**: Move on to the next blind or the next Ante.

#### Resource Limits

| Resource | Description |
|----------|-------------|
| ✋ Hands | Number of hands you can play per blind (default: 4) |
| 🗑️ Discards | Number of times you can discard per blind (default: 3) |
| 💰 Money | Currency used to buy items in the shop |

#### Boss Blinds

Boss Blinds have unique abilities that add extra challenge:

> [!NOTE]
> Boss abilities are thematic AI personality modifiers rather than card-based mechanical effects.

| Boss | Ability |
|------|--------|
| 🧐 THE CYNIC (多疑者) | Deeply suspicious, aggressively calls bluffs with elevated confidence |
| 🪞 THE NARCISSIST (自负狂) | Overconfident in own model, highly susceptible to reverse baits |
| 🌫️ THE BLIND SPOT (盲区节点) | Sluggish pattern memory, delayed reaction to sequential tells |
| ⚡ THE OVERCLOCKER (超频核心) | Overclocked compute, higher target score, hyper-accelerated analysis |

---

## Hand Rankings

The game supports standard poker hand rankings, listed from weakest to strongest:

| Hand | Base Chips | Base Mult | Chips/Level | Mult/Level |
|------|-----------|-----------|-------------|------------|
| High Card | 5 | 1 | +10 | +1 |
| Pair | 10 | 2 | +15 | +1 |
| Two Pair | 20 | 2 | +20 | +1 |
| Three of a Kind | 30 | 3 | +20 | +2 |
| Straight | 30 | 4 | +30 | +3 |
| Flush | 35 | 4 | +15 | +2 |
| Full House | 40 | 4 | +25 | +2 |
| Four of a Kind | 60 | 7 | +30 | +3 |
| Straight Flush | 100 | 8 | +40 | +4 |

> 💡 In Roguelike mode, hand types can be **upgraded** to increase their base chips and multiplier. Growth per level varies by hand type (High Card: +10/+1, Straight Flush: +40/+4).

---

## Scoring System

Roguelike mode features a precision scoring engine. The final score is calculated as:

```
Final Score = (Base Chips + Card Chips + Modifier Chips + Joker Chips) × (Base Mult + Modifier Mult + Joker Mult) × Cognitive Mult
```

### Card Modifiers

Special cards can have modifiers that enhance scoring:

| Modifier | Effect | Visual |
|----------|--------|--------|
| ✨ FOIL | +50 Chips | Metallic sheen |
| 🌈 HOLO | +10 Mult | Rainbow reflection |
| 💎 POLY | ×1.5 Mult | Diamond texture |

### Tell Bonus

Your action timing also affects scoring:

| Timing | Bonus | Description |
|--------|-------|-------------|
| Fast action (< 600ms) | +25 Chips | Quick decisive play |
| Slow action (> 3000ms) | +2 Mult | Deliberate hesitation |

### Cognitive Evaluation

A unique scoring component that evaluates the gap between the AI's beliefs and reality:

| Scenario | Cognitive Multiplier |
|----------|---------------------|
| **Bluff Model Break** — AI thinks you're strong, but you played weak | 4.0x – 25.0x |
| **Reverse Monster** — AI thinks you're bluffing, but you have a monster hand | 5.0x |
| **Counter Bait** — Strong hand when AI suspects bluff | 2.5x |
| **Cognitive Discrepancy** — Significant belief divergence | 1.6x |
| Normal | 1.0x |

---

## Model Break

**Model Break** is BLUFF's signature mechanic.

### Trigger Conditions

When you successfully bluff — playing a weak hand while betting aggressively enough to make the AI believe you're strong — and the AI's confidence is high enough (the more thoroughly you've deceived it), a Model Break is triggered.

### How It Works

```
Trigger Probability = Bluff Gap × AI Confidence × Random Factor
```

- **Bluff Gap**: The difference between your actual hand strength and what the AI predicted
- **AI Confidence**: How confident the AI was in its (wrong) assessment

### Classic Mode Effects

| Effect | Description |
|--------|-------------|
| 🎯 Understanding Damage | AI's understanding drops (-250 to -300), making future deception easier |
| 💰 Reward Bonus | Earn bonus chips (50–60% of pot) |
| 🛡️ Buff Selection | Choose 1 of 3 Buffs to enhance your abilities |

### Roguelike Mode Effects

Model Break multiplies your entire hand score by **up to 25.0x**, enabling you to meet steep late-game target scores through strategic deception.

---

## Buff System

After triggering a Model Break, you can choose one of **4 Buffs** to strengthen yourself:

| Buff | Name | Effect |
|------|------|--------|
| 🎭 False Tell | FALSE_TELL | Adds noise to your behavioral data, confusing the AI's analysis |
| 🧪 Memory Poison | MEMORY_POISON | Corrupts the AI's memory of your recent hand history |
| 🔮 Counter Read | COUNTER_READ | When AI confidence ≥ 75%, doubles Model Break reward bonus and understanding damage |
| 👁️ Mind Read | MIND_READ | Unlocks the AI's full internal probability analysis panel, revealing multi-dimensional behavioral assessments |

Once acquired, Buffs remain active for the entire game.

---

## Joker System

Jokers are the core deckbuilding element in Roguelike mode. They can be purchased in the shop, and you can hold a limited number at a time.

### Common

| Joker | Effect | Cost |
|-------|--------|------|
| 🔔 Pavlov's Bell | If 2 consecutive actions match your pattern, +25 Mult. | $4 |
| 🗿 Poker Face | If you act within 1.0s to 2.5s, +50 Chips. | $4 |
| ⏳ Fake Hesitation | Waiting > 2.5s before playing grants +35 Mult and +15 Chips. | $5 |
| 🧬 Fibonacci Neuron | Each played card with rank 2, 3, 5, or 8 gives +8 Mult. | $5 |
| 💊 Red Pill | Played Hearts or Diamonds give +20 Chips each. | $4 |
| 🧊 Black ICE | Played Spades or Clubs give +4 Mult each. | $4 |

### Uncommon

| Joker | Effect | Cost |
|-------|--------|------|
| 👁️ Confirmation Bias | When AI confidence >= 50%, gain x1.6 Mult (x2.0 if >= 70%). | $6 |
| 👻 Phantom Tell | If played hand is High Card, set base chips to 80. | $6 |
| 💨 Smoke Screen | Discarding Ace or King gives +60 Chips on the next hand played. | $5 |
| 📡 Echo Chamber | The last played card retriggers its chip value and +15 Mult. | $6 |
| 🎨 Chromatic Aberration | If hand contains both black and red suits, gain x1.8 Mult. | $6 |
| ⚛️ Quantum Entanglement | If played hand is Pair, +40 Chips and x1.6 Mult. | $6 |

### Rare

| Joker | Effect | Cost |
|-------|--------|------|
| ⚡ Cognitive Overload | Gains +0.5x Mult each time MODEL BREAK is triggered. | $8 |
| 🔄 Reverse Psychology | If AI predicts you are in TILT, gain x2.0 Mult. | $7 |
| 👾 The Glitch | MODEL BREAK Cognitive Multiplier is boosted by +50%. | $8 |
| 🔒 Logic Deadlock | If played hand is High Card, gain x2.5 Mult; other hands gain x1.3 Mult. | $7 |
| 🧠 Neural Feedback | Each played face card or Ace grants x1.3 Mult. | $8 |
| 🌌 Turing Shifter | If AI belief differs from actual hand type, gain x2.2 Mult. | $8 |

---

## Shop System
 
After beating each blind, you enter the shop. The shop generates 4 items per visit:
- 2 × Random Jokers (from unowned pool)
- 1 × Hand Upgrade Scroll (random hand type, $2-$5)
- 1 × Memory Mod (random)

### Hand Upgrade Scrolls
| Name | Effect | Price |
|------|--------|-------|
| Straight Flush Apex Scroll | Straight Flush +1 Level | $5 |
| Four of a Kind Data Scroll | Four of a Kind +1 Level | $4 |
| Full House Data Scroll | Full House +1 Level | $4 |
| Flush Data Scroll | Flush +1 Level | $3 |
| Straight Data Scroll | Straight +1 Level | $3 |
| Three of a Kind Data Scroll | Three of a Kind +1 Level | $3 |
| Two Pair Data Scroll | Two Pair +1 Level | $2 |
| Pair Data Scroll | Pair +1 Level | $2 |
| High Card Data Scroll | High Card +1 Level | $2 |

### Memory Mods
| Name | Effect | Price |
|------|--------|-------|
| ✨ Quantum Foil Coating | Apply FOIL modifier to selected card (+30 extra chips) | $3 |
| 🌈 Holographic Coating | Apply HOLO modifier to selected card (+10 mult) | $4 |
| 💎 Polychrome Finish | Apply POLY modifier to selected card (×1.5 mult) | $5 |
| 🔄 Suit Transmuter | Swap selected card's suit between ♠↔♥ | $2 |
| 🗑️ Memory Purge | Permanently delete a card from your hand to thin the deck | $1 |

### Rerolling

Shop inventory can be rerolled for fresh items. The reroll cost increases with each use (starting at $2).

---

## AI Opponent

BLUFF's AI opponent uses a two-layer decision system:

### Heuristic Engine

A rule-based decision system that analyzes:
- Your **raise rate, fold rate, and all-in rate**
- Your **bet timing** (fast raises may indicate bluffing)
- Your **behavior after losses** (detects tilt)
- Your **historical action patterns** and repeated sequences

### AI Model (Optional)

Uses a large language model (LLM) for deeper behavioral analysis:
- Classifies your behavior into 4 intent categories:
  - **GENUINE_STRONG** — Playing a genuinely strong hand
  - **CALCULATED_BLUFF** — A deliberate deception
  - **TEMPO_MANIPULATION** — Deceptive timing to disguise strength
  - **DESPERATION_DIG** — Scrambling with a weak hand under pressure
- Predicts bluff probability (0–100%)
- Recommends action with confidence level

> [!NOTE]
> Using the AI model requires configuring `TYPESAFE_API_KEY` in `.env.local` (obtain from [TypeSafe AI](https://typesafe.ai)). If not configured or if the API call times out (>1200ms), the system automatically falls back to the heuristic engine. The game works perfectly fine without it.

The AI can only see **observable information** — your betting actions, historical data, and behavioral patterns. It never sees your hole cards.

---

## Autopilot Mode

The game includes an Autopilot mode that plays games automatically:

- ⏩ Adjustable speed: 1x / 2x
- 📊 Auto-tracking: total hands, win rate, Model Break count, biggest bluff
- Great for running overnight or observing AI behavior

---

## Strategy Guide

### Classic Mode Strategy

1. **Establish patterns, then break them**: Play normally for a few hands so the AI builds a model of your behavior, then suddenly bluff.
2. **Watch your timing**: The AI analyzes your action delays. Deliberately slowing down or speeding up can confuse it.
3. **Focus on triggering Model Breaks**: Lowering the AI's understanding makes subsequent bluffs easier to succeed.
4. **Use Buffs wisely**: Choose Buffs that complement your play style.
   - Aggressive players → False Tell, Memory Poison
   - Cautious players → Counter Read, Mind Read

### Roguelike Mode Strategy

1. **Build synergies first**: Prioritize Joker combinations that work well together. Example: suit-based Jokers + cards of that suit.
2. **Manage resources carefully**: You have limited hands per blind — don't waste them on low-scoring plays.
3. **Upgrade key hand types**: If your build revolves around a specific hand (e.g., Pairs), prioritize upgrading that hand type.
4. **Use discards effectively**: Discarding isn't wasted — it helps optimize your hand composition.
5. **Plan for Boss abilities**: Adjust your strategy ahead of time to handle Boss Blind restrictions.
6. **Money management**: Don't impulse buy — select shop items that synergize with your current build. Interest rewards saving money (\$1 per \$5 held, up to \$5).

---

## Controls

| Action | Description |
|--------|-------------|
| Click a card | Select / deselect a card |
| Play Hand button | Play the selected card combination |
| Discard button | Discard selected cards and draw replacements |
| Action buttons | Fold / Call / Raise / All-In (Classic mode) |

---

## Technical Info

- **Framework**: Next.js 16 + React 19
- **State Management**: Zustand
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **AI SDK**: @typesafe-ai/sdk
- **Font**: Fusion Pixel 12px (pixel art style)
- **i18n**: Chinese / English bilingual support

---

> 🎲 **Remember**: In the world of BLUFF, the strongest hand doesn't always win — the best liar does.
