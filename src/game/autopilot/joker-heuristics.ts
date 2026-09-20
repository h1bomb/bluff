import { JokerInstance } from '../jokers/types';

export const JOKER_TIERS: Record<string, number> = {
  NEURAL_FEEDBACK: 100,
  CHROMATIC_ABERRATION: 95,
  TURING_SHIFTER: 95,
  QUANTUM_ENTANGLEMENT: 90,
  CONFIRMATION_BIAS: 88,
  COGNITIVE_OVERLOAD: 85,
  THE_GLITCH: 85,
  ECHO_CHAMBER: 80,
  LOGIC_DEADLOCK: 70,
  PAVLOVS_BELL: 65,
  FAKE_HESITATION: 60,
  POKER_FACE: 55,
  RED_PILL: 55,
  BLACK_ICE: 55,
  FIBONACCI_NEURON: 50,
  SMOKE_SCREEN: 45,
  PHANTOM_TELL: 40,
  REVERSE_PSYCHOLOGY: 40,
};

export function getSimulatedDelayMs(jokers: JokerInstance[]): number {
  const keys = new Set(jokers.map((j) => j.jokerKey));

  return keys.has('FAKE_HESITATION')
    ? 3200  // >2.5s triggers Fake Hesitation +30 Mult
    : keys.has('POKER_FACE')
    ? 1500  // 1.0s~2.5s triggers Poker Face +50 Chips
    : keys.has('PAVLOVS_BELL')
    ? 450   // Fast action for Pavlov pattern match
    : keys.has('PHANTOM_TELL')
    ? 3800  // >3.0s triggers Hesitation tell bonus
    : 650;
}

// Jokers whose payout depends on action timing share a delay band. Owning two
// bands that fight over the same actionDelayMs makes both worse; aligned bands
// reinforce each other.
const DELAY_BAND: Record<string, 'MID' | 'SLOW'> = {
  POKER_FACE: 'MID', // 1.0s–2.5s
  FAKE_HESITATION: 'SLOW', // >2.5s
  PHANTOM_TELL: 'SLOW', // farmed via slow junk-hand plays
};

// Explicit pair synergies on top of band alignment.
const JOKER_PAIR_BONUS: Record<string, Record<string, number>> = {
  PAVLOVS_BELL: { CONFIRMATION_BIAS: 10 }, // repetition feeds AI confidence
  CONFIRMATION_BIAS: { PAVLOVS_BELL: 10 },
  NEURAL_FEEDBACK: { ECHO_CHAMBER: 10 }, // both reward high-rank density
  ECHO_CHAMBER: { NEURAL_FEEDBACK: 10 },
};

/**
 * Situational value adjustment for buying `itemKey` given the current kit.
 * Positive = synergistic, negative = conflicting.
 */
export function getJokerSynergyBonus(itemKey: string, existing: JokerInstance[]): number {
  const key = itemKey.toUpperCase();
  const band = DELAY_BAND[key];
  let bonus = 0;
  for (const j of existing) {
    const otherKey = j.jokerKey?.toUpperCase();
    const otherBand = DELAY_BAND[otherKey];
    if (band && otherBand) bonus += band === otherBand ? 15 : -15;
    bonus += JOKER_PAIR_BONUS[key]?.[otherKey] ?? 0;
  }
  return bonus;
}
