import { Card } from '../types';
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

export function getSuitBonus(combo: Card[], jokers: JokerInstance[]): number {
  let bonus = 0;
  const keys = new Set(jokers.map((j) => j.jokerKey));

  if (keys.has('BLACK_ICE')) {
    bonus += combo.filter((c) => c.suit === '♠' || c.suit === '♣').length * 4;
  }
  if (keys.has('RED_PILL')) {
    bonus += combo.filter((c) => c.suit === '♥' || c.suit === '♦').length * 20;
  }
  if (keys.has('CHROMATIC_ABERRATION')) {
    const hasBlack = combo.some((c) => c.suit === '♠' || c.suit === '♣');
    const hasRed = combo.some((c) => c.suit === '♥' || c.suit === '♦');
    if (hasBlack && hasRed) bonus += 80; // x1.8 Mult is massive
  }
  if (keys.has('NEURAL_FEEDBACK')) {
    bonus += combo.filter((c) => c.rank >= 11).length * 30; // face cards = x1.3 each
  }
  if (keys.has('ECHO_CHAMBER')) {
    const lastCard = combo[combo.length - 1];
    if (lastCard) {
      bonus += lastCard.rank === 14 ? 11 : Math.min(10, lastCard.rank); // retrigger
    }
  }
  return bonus;
}
