import {
  BuffInstance,
  ModelBreakPayload,
  ObservablePlayerState,
} from '../types';
import { BUFF_DEFINITIONS } from './definitions';

export function applyObservableBuffHooks(
  state: ObservablePlayerState,
  activeBuffs: BuffInstance[]
): ObservablePlayerState {
  let modified = { ...state };
  for (const buff of activeBuffs) {
    const def = BUFF_DEFINITIONS[buff.id];
    if (def?.modifyObservableState) {
      modified = def.modifyObservableState(modified);
    }
  }
  return modified;
}

export function applyModelBreakBuffHooks(
  payload: ModelBreakPayload,
  activeBuffs: BuffInstance[]
): ModelBreakPayload {
  let modified = { ...payload };
  for (const buff of activeBuffs) {
    const def = BUFF_DEFINITIONS[buff.id];
    if (def?.modifyModelBreak) {
      modified = def.modifyModelBreak(modified);
    }
  }
  return modified;
}

export function hasMindReadBuff(activeBuffs: BuffInstance[]): boolean {
  return activeBuffs.some(b => b.id === 'MIND_READ');
}
