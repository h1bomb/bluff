import { choice, noul, score } from '@typesafe-ai/sdk';

// Optimized for 3-Card Poker Roguelike with AI cognitive warfare mechanics.
// Reduced from 7 behavior choices to 4 sharp intents to boost confidence peaks
// and reliably trigger MODEL BREAK / Confirmation Bias / Joker combos.
export const JEV_QUESTIONS = {
  behavior: choice(
    'In this 3-card poker roguelike, analyze the human player’s underlying psychological state and strategic goal based on their hand history, action rhythm, and board context:',
    {
      GENUINE_STRONG: 'Conviction Play: Holding a mathematically premium combination (Flush, Straight, Trips) and committing to maximize raw score and crush the blind.',
      CALCULATED_BLUFF: 'Psychological Ambush: Feigning strength or baiting the AI into believing they hold a monster hand, aiming to induce a catastrophic misread (MODEL BREAK).',
      TEMPO_MANIPULATION: 'Tactical Deception: Exploiting timing variations, deliberate stalls, or deceptive rhythms specifically to mask hand strength or fish for tell triggers.',
      DESPERATION_DIG: 'Survival Scramble: Starved of winning cards, playing suboptimal discard-scavenging hands under escalating blind pressure.',
    }
  ),

  bluff: noul(
    'Is the player bluffing or setting a deliberate trap (feigning strength while secretly holding weak cards)?'
  ),

  baiting: noul(
    'Is the player sandbagging or slow-playing a dominant hand to lure the AI into overconfidence?'
  ),

  aggression: score(
    "Assess the player's play intensity from 0 (passive discard cycling) to 3 (all-in aggressive high-risk play):",
    [
      'Passive / discarding and cycling deck',
      'Neutral / standard play selection',
      'Aggressive / playing fast, targeting high scores',
      'Hyper-aggressive / speed-rushing with confidence',
    ] as const
  ),

  predictability: score(
    "How rigid and predictable is the player's card selection and timing pattern across recent hands (0 = chaotic, 3 = robotic):",
    [
      'Erratic / adaptive / unreadable',
      'Flexible with slight tendencies',
      'Obvious repeating patterns (same suits, same timing)',
      'Completely conditioned robot-like reflex',
    ] as const
  ),

  tilt: score(
    "Assess how much pressure the escalating blind target is exerting on the player's decision quality (0 = calm, 3 = panic):",
    [
      'Calm / calculating comfortably',
      'Mild tension / checking scores frequently',
      'High stress / risky suboptimal plays',
      'Full cognitive overload / panic play',
    ] as const
  ),
};
