import {
  BuffId,
  BuffInstance,
  ObservablePlayerState,
  ModelBreakPayload,
} from '../types';
import zhJson from '@/lib/i18n/locales/zh.json';

export const BUFF_DEFINITIONS: Record<BuffId, {
  name: string;
  tagline: string;
  description: string;
  icon: string;
  modifyObservableState?: (state: ObservablePlayerState) => ObservablePlayerState;
  modifyModelBreak?: (payload: ModelBreakPayload) => ModelBreakPayload;
}> = {
  FALSE_TELL: {
    name: 'FALSE TELL',
    tagline: zhJson.buffs.FALSE_TELL.tagline,
    description: zhJson.buffs.FALSE_TELL.description,
    icon: '🎭',
    modifyObservableState: (state: ObservablePlayerState): ObservablePlayerState => {
      const patterns = { ...state.patterns };
      if (patterns.fastRaiseRate > 0) {
        patterns.fastRaiseRate = Math.min(1.0, patterns.fastRaiseRate * 1.5);
      }
      if (patterns.raiseRate > 0.3) {
        patterns.raiseRate = Math.min(1.0, patterns.raiseRate * 1.25);
      }
      if (!patterns.repeatedSequences.includes('FORCED_HABIT_TELL')) {
        patterns.repeatedSequences = [...patterns.repeatedSequences, 'FORCED_HABIT_TELL'];
      }
      return {
        ...state,
        patterns,
      };
    },
  },

  MEMORY_POISON: {
    name: 'MEMORY POISON',
    tagline: zhJson.buffs.MEMORY_POISON.tagline,
    description: zhJson.buffs.MEMORY_POISON.description,
    icon: '🧪',
    modifyObservableState: (state: ObservablePlayerState): ObservablePlayerState => {
      if (state.recentHands.length === 0) return state;
      const lastHand = state.recentHands[state.recentHands.length - 1];
      // Clone last hand 2 extra times to simulate 3x memory weight
      const poisonedHands = [
        ...state.recentHands,
        { ...lastHand, handIndex: state.handIndex - 0.5 },
        { ...lastHand, handIndex: state.handIndex - 0.2 },
      ];
      return {
        ...state,
        recentHands: poisonedHands,
      };
    },
  },

  COUNTER_READ: {
    name: 'COUNTER READ',
    tagline: zhJson.buffs.COUNTER_READ.tagline,
    description: zhJson.buffs.COUNTER_READ.description,
    icon: '⚡',
    modifyModelBreak: (payload: ModelBreakPayload): ModelBreakPayload => {
      if (payload.aiConfidence >= 0.75) {
        return {
          ...payload,
          rewardBonus: payload.rewardBonus * 2,
          understandingDamage: payload.understandingDamage * 2,
        };
      }
      return payload;
    },
  },

  MIND_READ: {
    name: 'MIND READ',
    tagline: zhJson.buffs.MIND_READ.tagline,
    description: zhJson.buffs.MIND_READ.description,
    icon: '👁️',
  },
};

export const ALL_BUFF_IDS: BuffId[] = [
  'FALSE_TELL',
  'MEMORY_POISON',
  'COUNTER_READ',
  'MIND_READ',
];

export function createBuffInstance(id: BuffId, handIndex: number): BuffInstance {
  const def = BUFF_DEFINITIONS[id];
  return {
    id,
    name: def.name,
    tagline: def.tagline,
    description: def.description,
    icon: def.icon,
    acquiredAtHand: handIndex,
  };
}

export function getRandomBuffSelection(
  existingBuffIds: BuffId[],
  count: number = 3,
  handIndex: number = 1
): BuffInstance[] {
  const available = ALL_BUFF_IDS.filter(id => !existingBuffIds.includes(id));
  const pool = available.length >= count ? available : ALL_BUFF_IDS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(id => createBuffInstance(id, handIndex));
}
