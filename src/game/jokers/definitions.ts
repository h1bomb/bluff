import { JokerDefinition, JokerInstance } from './types';
import zhJson from '@/lib/i18n/locales/zh.json';
import enJson from '@/lib/i18n/locales/en.json';
import { format } from '@/lib/i18n/translations';

const zhItems = zhJson.jokers.items;
const enItems = enJson.jokers.items;

export const JOKER_DEFINITIONS: Record<string, JokerDefinition> = {
  PAVLOVS_BELL: {
    key: 'PAVLOVS_BELL',
    name: enItems.PAVLOVS_BELL.name,
    nameZh: zhItems.PAVLOVS_BELL.name,
    description: enItems.PAVLOVS_BELL.description,
    descriptionZh: zhItems.PAVLOVS_BELL.description,
    rarity: 'COMMON',
    cost: 4,
    icon: '🔔',
    onPlayHand: (ctx) => {
      const seq = ctx.consecutiveActions || [];
      if (seq.length >= 2 && seq[seq.length - 1] === seq[seq.length - 2]) {
        return {
          multAdded: 25,
          message: enItems.PAVLOVS_BELL.trigger,
          messageZh: zhItems.PAVLOVS_BELL.trigger,
        };
      }
      return {};
    },
  },

  CONFIRMATION_BIAS: {
    key: 'CONFIRMATION_BIAS',
    name: enItems.CONFIRMATION_BIAS.name,
    nameZh: zhItems.CONFIRMATION_BIAS.name,
    description: enItems.CONFIRMATION_BIAS.description,
    descriptionZh: zhItems.CONFIRMATION_BIAS.description,
    rarity: 'UNCOMMON',
    cost: 6,
    icon: '👁️',
    onPlayHand: (ctx) => {
      const conf = ctx.belief?.behavior.confidence ?? 0;
      if (conf >= 0.7) {
        return {
          xMult: 2.0,
          message: enItems.CONFIRMATION_BIAS.triggerPeak,
          messageZh: zhItems.CONFIRMATION_BIAS.triggerPeak,
        };
      } else if (conf >= 0.5) {
        return {
          xMult: 1.6,
          message: enItems.CONFIRMATION_BIAS.triggerNormal,
          messageZh: zhItems.CONFIRMATION_BIAS.triggerNormal,
        };
      }
      return {};
    },
  },

  POKER_FACE: {
    key: 'POKER_FACE',
    name: enItems.POKER_FACE.name,
    nameZh: zhItems.POKER_FACE.name,
    description: enItems.POKER_FACE.description,
    descriptionZh: zhItems.POKER_FACE.description,
    rarity: 'COMMON',
    cost: 4,
    icon: '🗿',
    onPlayHand: (ctx) => {
      const delay = ctx.actionDelayMs ?? 1500;
      if (delay >= 1000 && delay <= 2500) {
        return {
          chipsAdded: 50,
          message: enItems.POKER_FACE.trigger,
          messageZh: zhItems.POKER_FACE.trigger,
        };
      }
      return {};
    },
  },

  PHANTOM_TELL: {
    key: 'PHANTOM_TELL',
    name: enItems.PHANTOM_TELL.name,
    nameZh: zhItems.PHANTOM_TELL.name,
    description: enItems.PHANTOM_TELL.description,
    descriptionZh: zhItems.PHANTOM_TELL.description,
    rarity: 'UNCOMMON',
    cost: 6,
    icon: '👻',
    onPlayHand: (ctx) => {
      if (ctx.handType === 'HIGH_CARD') {
        const bonus = Math.max(0, 80 - ctx.baseChips);
        return {
          chipsAdded: bonus,
          message: enItems.PHANTOM_TELL.trigger,
          messageZh: zhItems.PHANTOM_TELL.trigger,
        };
      }
      return {};
    },
  },

  COGNITIVE_OVERLOAD: {
    key: 'COGNITIVE_OVERLOAD',
    name: enItems.COGNITIVE_OVERLOAD.name,
    nameZh: zhItems.COGNITIVE_OVERLOAD.name,
    description: enItems.COGNITIVE_OVERLOAD.description,
    descriptionZh: zhItems.COGNITIVE_OVERLOAD.description,
    rarity: 'RARE',
    cost: 8,
    icon: '⚡',
    onModelBreak: (_ctx, joker) => {
      joker.extraData = joker.extraData || { bonusXMult: 1.0 };
      const current = typeof joker.extraData.bonusXMult === 'number' ? joker.extraData.bonusXMult : 1.0;
      const next = current + 0.5;
      joker.extraData.bonusXMult = next;
      const xMult = next.toFixed(1);
      return {
        message: format(enItems.COGNITIVE_OVERLOAD.triggerUpgrade, { xMult }),
        messageZh: format(zhItems.COGNITIVE_OVERLOAD.triggerUpgrade, { xMult }),
      };
    },
    onPlayHand: (_ctx, joker) => {
      const bonus = typeof joker.extraData?.bonusXMult === 'number' ? joker.extraData.bonusXMult : 1.0;
      if (bonus > 1.0) {
        const xMult = bonus.toFixed(1);
        return {
          xMult: bonus,
          message: format(enItems.COGNITIVE_OVERLOAD.triggerPlay, { xMult }),
          messageZh: format(zhItems.COGNITIVE_OVERLOAD.triggerPlay, { xMult }),
        };
      }
      return {};
    },
  },

  FAKE_HESITATION: {
    key: 'FAKE_HESITATION',
    name: enItems.FAKE_HESITATION.name,
    nameZh: zhItems.FAKE_HESITATION.name,
    description: enItems.FAKE_HESITATION.description,
    descriptionZh: zhItems.FAKE_HESITATION.description,
    rarity: 'COMMON',
    cost: 5,
    icon: '⏳',
    onPlayHand: (ctx) => {
      const delay = ctx.actionDelayMs ?? 0;
      if (delay > 2500) {
        return {
          chipsAdded: 15,
          multAdded: 35,
          message: enItems.FAKE_HESITATION.trigger,
          messageZh: zhItems.FAKE_HESITATION.trigger,
        };
      }
      return {};
    },
  },

  FIBONACCI_NEURON: {
    key: 'FIBONACCI_NEURON',
    name: enItems.FIBONACCI_NEURON.name,
    nameZh: zhItems.FIBONACCI_NEURON.name,
    description: enItems.FIBONACCI_NEURON.description,
    descriptionZh: zhItems.FIBONACCI_NEURON.description,
    rarity: 'COMMON',
    cost: 5,
    icon: '🧬',
    onPlayHand: (ctx) => {
      const fibs = [2, 3, 5, 8];
      const count = ctx.handCards.filter((c) => fibs.includes(c.rank)).length;
      if (count > 0) {
        const mult = count * 8;
        return {
          multAdded: mult,
          message: format(enItems.FIBONACCI_NEURON.trigger, { count, mult }),
          messageZh: format(zhItems.FIBONACCI_NEURON.trigger, { count, mult }),
        };
      }
      return {};
    },
  },

  RED_PILL: {
    key: 'RED_PILL',
    name: enItems.RED_PILL.name,
    nameZh: zhItems.RED_PILL.name,
    description: enItems.RED_PILL.description,
    descriptionZh: zhItems.RED_PILL.description,
    rarity: 'COMMON',
    cost: 4,
    icon: '💊',
    onPlayHand: (ctx) => {
      const reds = ctx.handCards.filter((c) => c.suit === '♥' || c.suit === '♦').length;
      if (reds > 0) {
        const chips = reds * 20;
        return {
          chipsAdded: chips,
          message: format(enItems.RED_PILL.trigger, { chips }),
          messageZh: format(zhItems.RED_PILL.trigger, { chips }),
        };
      }
      return {};
    },
  },

  BLACK_ICE: {
    key: 'BLACK_ICE',
    name: enItems.BLACK_ICE.name,
    nameZh: zhItems.BLACK_ICE.name,
    description: enItems.BLACK_ICE.description,
    descriptionZh: zhItems.BLACK_ICE.description,
    rarity: 'COMMON',
    cost: 4,
    icon: '🧊',
    onPlayHand: (ctx) => {
      const blacks = ctx.handCards.filter((c) => c.suit === '♠' || c.suit === '♣').length;
      if (blacks > 0) {
        const mult = blacks * 4;
        return {
          multAdded: mult,
          message: format(enItems.BLACK_ICE.trigger, { mult }),
          messageZh: format(zhItems.BLACK_ICE.trigger, { mult }),
        };
      }
      return {};
    },
  },

  SMOKE_SCREEN: {
    key: 'SMOKE_SCREEN',
    name: enItems.SMOKE_SCREEN.name,
    nameZh: zhItems.SMOKE_SCREEN.name,
    description: enItems.SMOKE_SCREEN.description,
    descriptionZh: zhItems.SMOKE_SCREEN.description,
    rarity: 'UNCOMMON',
    cost: 5,
    icon: '💨',
    onDiscard: (cards, joker) => {
      const highDiscards = cards.filter((c) => c.rank === 14 || c.rank === 13).length;
      if (highDiscards > 0) {
        joker.extraData = joker.extraData || {};
        joker.extraData.armed = true;
        return {
          message: enItems.SMOKE_SCREEN.triggerArmed,
          messageZh: zhItems.SMOKE_SCREEN.triggerArmed,
        };
      }
      return {};
    },
    onPlayHand: (_ctx, joker) => {
      if (joker.extraData?.armed) {
        joker.extraData.armed = false;
        return {
          chipsAdded: 60,
          message: enItems.SMOKE_SCREEN.triggerActive,
          messageZh: zhItems.SMOKE_SCREEN.triggerActive,
        };
      }
      return {};
    },
  },

  REVERSE_PSYCHOLOGY: {
    key: 'REVERSE_PSYCHOLOGY',
    name: enItems.REVERSE_PSYCHOLOGY.name,
    nameZh: zhItems.REVERSE_PSYCHOLOGY.name,
    description: enItems.REVERSE_PSYCHOLOGY.description,
    descriptionZh: zhItems.REVERSE_PSYCHOLOGY.description,
    rarity: 'RARE',
    cost: 7,
    icon: '🔄',
    onPlayHand: (ctx) => {
      if (ctx.belief?.behavior.value === 'TILT' || (ctx.belief?.tilt ?? 0) > 0.6) {
        return {
          xMult: 2.0,
          message: enItems.REVERSE_PSYCHOLOGY.trigger,
          messageZh: zhItems.REVERSE_PSYCHOLOGY.trigger,
        };
      }
      return {};
    },
  },

  THE_GLITCH: {
    key: 'THE_GLITCH',
    name: enItems.THE_GLITCH.name,
    nameZh: zhItems.THE_GLITCH.name,
    description: enItems.THE_GLITCH.description,
    descriptionZh: zhItems.THE_GLITCH.description,
    rarity: 'RARE',
    cost: 8,
    icon: '👾',
    onModelBreak: () => {
      return {
        cognitiveMultMultiplier: 1.5,
        message: enItems.THE_GLITCH.trigger,
        messageZh: zhItems.THE_GLITCH.trigger,
      };
    },
  },

  ECHO_CHAMBER: {
    key: 'ECHO_CHAMBER',
    name: enItems.ECHO_CHAMBER.name,
    nameZh: zhItems.ECHO_CHAMBER.name,
    description: enItems.ECHO_CHAMBER.description,
    descriptionZh: zhItems.ECHO_CHAMBER.description,
    rarity: 'UNCOMMON',
    cost: 6,
    icon: '📡',
    onPlayHand: (ctx) => {
      if (ctx.handCards.length > 0) {
        const lastCard = ctx.handCards[ctx.handCards.length - 1];
        const extraChips = lastCard.rank === 14 ? 11 : Math.min(10, lastCard.rank);
        const card = `${lastCard.suit}${lastCard.rank}`;
        return {
          chipsAdded: extraChips,
          multAdded: 15,
          message: format(enItems.ECHO_CHAMBER.trigger, { card, chips: extraChips }),
          messageZh: format(zhItems.ECHO_CHAMBER.trigger, { card, chips: extraChips }),
        };
      }
      return {};
    },
  },

  LOGIC_DEADLOCK: {
    key: 'LOGIC_DEADLOCK',
    name: enItems.LOGIC_DEADLOCK.name,
    nameZh: zhItems.LOGIC_DEADLOCK.name,
    description: enItems.LOGIC_DEADLOCK.description,
    descriptionZh: zhItems.LOGIC_DEADLOCK.description,
    rarity: 'RARE',
    cost: 7,
    icon: '🔒',
    onPlayHand: (ctx) => {
      if (ctx.handType === 'HIGH_CARD') {
        return {
          xMult: 2.5,
          message: enItems.LOGIC_DEADLOCK.triggerHighCard,
          messageZh: zhItems.LOGIC_DEADLOCK.triggerHighCard,
        };
      }
      return {
        xMult: 1.3,
        message: enItems.LOGIC_DEADLOCK.triggerNormal,
        messageZh: zhItems.LOGIC_DEADLOCK.triggerNormal,
      };
    },
  },

  CHROMATIC_ABERRATION: {
    key: 'CHROMATIC_ABERRATION',
    name: enItems.CHROMATIC_ABERRATION.name,
    nameZh: zhItems.CHROMATIC_ABERRATION.name,
    description: enItems.CHROMATIC_ABERRATION.description,
    descriptionZh: zhItems.CHROMATIC_ABERRATION.description,
    rarity: 'UNCOMMON',
    cost: 6,
    icon: '🎨',
    onPlayHand: (ctx) => {
      const hasBlack = ctx.handCards.some((c) => c.suit === '♠' || c.suit === '♣');
      const hasRed = ctx.handCards.some((c) => c.suit === '♥' || c.suit === '♦');
      if (hasBlack && hasRed) {
        return {
          xMult: 1.8,
          message: enItems.CHROMATIC_ABERRATION.trigger,
          messageZh: zhItems.CHROMATIC_ABERRATION.trigger,
        };
      }
      return {};
    },
  },

  NEURAL_FEEDBACK: {
    key: 'NEURAL_FEEDBACK',
    name: enItems.NEURAL_FEEDBACK.name,
    nameZh: zhItems.NEURAL_FEEDBACK.name,
    description: enItems.NEURAL_FEEDBACK.description,
    descriptionZh: zhItems.NEURAL_FEEDBACK.description,
    rarity: 'RARE',
    cost: 8,
    icon: '🧠',
    onPlayHand: (ctx) => {
      const faceCount = ctx.handCards.filter((c) => c.rank >= 11).length;
      if (faceCount > 0) {
        const totalXMult = Math.round(Math.pow(1.3, faceCount) * 10) / 10;
        return {
          xMult: totalXMult,
          message: format(enItems.NEURAL_FEEDBACK.trigger, { count: faceCount, xMult: totalXMult }),
          messageZh: format(zhItems.NEURAL_FEEDBACK.trigger, { count: faceCount, xMult: totalXMult }),
        };
      }
      return {};
    },
  },

  QUANTUM_ENTANGLEMENT: {
    key: 'QUANTUM_ENTANGLEMENT',
    name: enItems.QUANTUM_ENTANGLEMENT.name,
    nameZh: zhItems.QUANTUM_ENTANGLEMENT.name,
    description: enItems.QUANTUM_ENTANGLEMENT.description,
    descriptionZh: zhItems.QUANTUM_ENTANGLEMENT.description,
    rarity: 'UNCOMMON',
    cost: 6,
    icon: '⚛️',
    onPlayHand: (ctx) => {
      if (ctx.handType === 'PAIR') {
        return {
          chipsAdded: 40,
          xMult: 1.6,
          message: enItems.QUANTUM_ENTANGLEMENT.trigger,
          messageZh: zhItems.QUANTUM_ENTANGLEMENT.trigger,
        };
      }
      return {};
    },
  },

  TURING_SHIFTER: {
    key: 'TURING_SHIFTER',
    name: enItems.TURING_SHIFTER.name,
    nameZh: zhItems.TURING_SHIFTER.name,
    description: enItems.TURING_SHIFTER.description,
    descriptionZh: zhItems.TURING_SHIFTER.description,
    rarity: 'RARE',
    cost: 8,
    icon: '🌌',
    onPlayHand: (ctx) => {
      if (ctx.belief && (ctx.belief.reversePrediction > 0.2 || ctx.belief.bluff > 0.4)) {
        return {
          xMult: 2.2,
          message: enItems.TURING_SHIFTER.trigger,
          messageZh: zhItems.TURING_SHIFTER.trigger,
        };
      }
      return {};
    },
  },
};

export function createJokerInstance(key: string): JokerInstance {
  const def = JOKER_DEFINITIONS[key] || JOKER_DEFINITIONS.PAVLOVS_BELL;
  return {
    id: `joker_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    jokerKey: def.key,
    name: def.name,
    nameZh: def.nameZh,
    description: def.description,
    descriptionZh: def.descriptionZh,
    rarity: def.rarity,
    cost: def.cost,
    sellValue: Math.max(1, Math.floor(def.cost / 2)),
    icon: def.icon,
  };
}

export function getRandomJokers(count: number, excludeKeys: string[] = []): JokerDefinition[] {
  const pool = Object.values(JOKER_DEFINITIONS).filter((j) => !excludeKeys.includes(j.key));
  // Shuffle
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
