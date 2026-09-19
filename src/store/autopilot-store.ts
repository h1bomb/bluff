import { create } from 'zustand';
import { AutopilotDecision } from '@/game/autopilot/types';
import { evaluateAutopilotDecisions } from '@/game/autopilot/evaluator';
import { PublicGameState } from '@/game/types';
import { ShopItem } from '@/game/shop/types';
import { runAutopilotDecision } from '@/game/autopilot/executor';
import { AutopilotThoughtLogEntry } from '@/lib/history/types';

export interface AutopilotGameActions {
  setSelectedCards: (cardIds: string[]) => Promise<void> | void;
  toggleSelectCard?: (cardId: string) => Promise<void> | void;
  playHand: (cardIds?: string[]) => Promise<boolean>;
  discardCards: (cardIds?: string[]) => Promise<boolean>;
  buyShopItem: (item: ShopItem) => Promise<boolean>;
  sellJoker?: (jokerId: string) => Promise<void> | void;
  rerollShop?: () => Promise<boolean> | void;
  nextBlind: () => Promise<void> | void;
  dismissScoreTally: () => void;
}

interface AutopilotState {
  isEnabled: boolean;
  speed: '1x' | '2x';
  decisions: AutopilotDecision[];
  thoughtLogs: AutopilotThoughtLogEntry[];
  isExecuting: boolean;
  isMobileDrawerOpen: boolean;

  // Actions
  toggleAutopilot: () => void;
  setAutopilot: (enabled: boolean) => void;
  setSpeed: (speed: '1x' | '2x') => void;
  setMobileDrawerOpen: (open: boolean) => void;
  addThoughtLog: (log: string | { zh: string; en: string; timestamp?: string }) => void;
  updateDecisions: (publicState: PublicGameState, shopInventory?: ShopItem[]) => void;
  executeDecision: (decision: AutopilotDecision, gameStoreActions: AutopilotGameActions) => Promise<void>;
}

export const useAutopilotStore = create<AutopilotState>((set, get) => ({
  isEnabled: false,
  speed: '1x',
  decisions: [],
  thoughtLogs: [
    {
      timestamp: new Date().toLocaleTimeString(),
      zh: 'JEY 认知矩阵已初始化',
      en: 'JEV COGNITIVE MATRIX INITIALIZED',
    },
    {
      timestamp: new Date().toLocaleTimeString(),
      zh: '等待神经决策输入向量...',
      en: 'AWAITING NEURAL INPUT VECTORS...',
    },
  ],
  isExecuting: false,
  isMobileDrawerOpen: false,

  toggleAutopilot: () => {
    const next = !get().isEnabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bluff_autopilot_enabled', String(next));
      } catch {}
    }
    set({ isEnabled: next });
    get().addThoughtLog(
      next
        ? {
            zh: '>>> 自动驾驶已启动：全自主认知接管',
            en: '>>> AUTOPILOT ENGAGED: Full autonomous control active.',
          }
        : {
            zh: '>>> 自动驾驶待命：切换至协同辅助模式',
            en: '>>> AUTOPILOT STANDBY: Switched to co-pilot assist mode.',
          }
    );
  },

  setAutopilot: (enabled: boolean) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bluff_autopilot_enabled', String(enabled));
      } catch {}
    }
    set({ isEnabled: enabled });
    get().addThoughtLog(
      enabled
        ? {
            zh: '>>> 自动驾驶已启动：全自主认知接管',
            en: '>>> AUTOPILOT ENGAGED: Full autonomous control active.',
          }
        : {
            zh: '>>> 自动驾驶待命：切换至协同辅助模式',
            en: '>>> AUTOPILOT STANDBY: Switched to co-pilot assist mode.',
          }
    );
  },

  setSpeed: (speed) => {
    set({ speed });
    get().addThoughtLog({
      zh: `>>> 时钟频率已设为 ${speed}`,
      en: `>>> Clock speed set to ${speed}.`,
    });
  },

  setMobileDrawerOpen: (open) => {
    set({ isMobileDrawerOpen: open });
  },

  addThoughtLog: (log: string | { zh: string; en: string; timestamp?: string }) => {
    const timestamp = new Date().toLocaleTimeString();
    let entry: AutopilotThoughtLogEntry;
    if (typeof log === 'string') {
      entry = log.startsWith('[') ? log : `[${timestamp}] ${log}`;
    } else {
      entry = {
        timestamp: log.timestamp || timestamp,
        zh: log.zh,
        en: log.en,
      };
    }
    set((state) => ({
      thoughtLogs: [entry, ...state.thoughtLogs].slice(0, 50), // keep latest 50 logs
    }));
  },

  updateDecisions: (publicState: PublicGameState, shopInventory?: ShopItem[]) => {
    if (!publicState) return;
    const evaluated = evaluateAutopilotDecisions(publicState, shopInventory);
    set({ decisions: evaluated });
  },

  executeDecision: async (decision: AutopilotDecision, gameStoreActions: AutopilotGameActions) => {
    const { isExecuting, speed } = get();
    if (isExecuting) return;

    set({ isExecuting: true });
    try {
      await runAutopilotDecision(decision, gameStoreActions, speed, (log) => get().addThoughtLog(log));
    } catch (err) {
      console.error('Autopilot execution error:', err);
      get().addThoughtLog({
        zh: `❌ 执行异常: ${String(err)}`,
        en: `❌ Execution error: ${String(err)}`,
      });
    } finally {
      set({ isExecuting: false });
    }
  },
}));
