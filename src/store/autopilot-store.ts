import { create } from 'zustand';
import { AutopilotDecision } from '@/game/autopilot/types';
import { evaluateAutopilotDecisions, isObviousDecision } from '@/game/autopilot/evaluator';
import { PublicGameState } from '@/game/types';
import { ShopItem } from '@/game/shop/types';
import { runAutopilotDecision } from '@/game/autopilot/executor';
import { AutopilotThoughtLogEntry } from '@/lib/history/types';
import { fetchAutopilotDecision, JevQuotaInfo, AutopilotPickResult } from '@/services/game-api';

export type AutopilotBrain = 'jev' | 'heuristic';

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

export interface ExecuteDecisionContext {
  /** Current game state, needed by the Jev brain pick. */
  publicState?: PublicGameState | null;
  /** Receives quota/throttle metadata from Jev brain picks. */
  onJevMeta?: (meta: { jevQuota?: JevQuotaInfo; jevThrottled?: boolean }) => void;
}

const BRAIN_STORAGE_KEY = 'bluff_autopilot_brain';

/** Cheap fingerprint of the state a pick was requested for; mismatch = stale. */
function stateKeyForPick(s: PublicGameState): string {
  return [
    s.gameId,
    s.phase,
    s.handIndex,
    s.currentRoundScore,
    s.money,
    s.handsLeft,
    s.discardsLeft,
    s.playerCards?.length,
    s.shopInventory?.length,
  ].join('|');
}

function readPersistedBrain(): AutopilotBrain {
  if (typeof window === 'undefined') return 'jev';
  try {
    return localStorage.getItem(BRAIN_STORAGE_KEY) === 'heuristic' ? 'heuristic' : 'jev';
  } catch {
    return 'jev';
  }
}

interface AutopilotState {
  isEnabled: boolean;
  speed: '1x' | '2x';
  brain: AutopilotBrain;
  decisions: AutopilotDecision[];
  thoughtLogs: AutopilotThoughtLogEntry[];
  isExecuting: boolean;
  isMobileDrawerOpen: boolean;
  /** In-flight prefetched Jev pick for the current state, if any. */
  pickCache: { key: string; promise: Promise<AutopilotPickResult | null> } | null;

  // Actions
  toggleAutopilot: () => void;
  setAutopilot: (enabled: boolean) => void;
  setSpeed: (speed: '1x' | '2x') => void;
  setBrain: (brain: AutopilotBrain) => void;
  setMobileDrawerOpen: (open: boolean) => void;
  addThoughtLog: (log: string | { zh: string; en: string; timestamp?: string }) => void;
  updateDecisions: (publicState: PublicGameState, shopInventory?: ShopItem[]) => void;
  executeDecision: (decision: AutopilotDecision, gameStoreActions: AutopilotGameActions, context?: ExecuteDecisionContext) => Promise<void>;
}

export const useAutopilotStore = create<AutopilotState>((set, get) => ({
  isEnabled: false,
  speed: '1x',
  brain: readPersistedBrain(),
  decisions: [],
  thoughtLogs: [
    {
      timestamp: new Date().toLocaleTimeString(),
      zh: 'JEV 认知矩阵已初始化',
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
  pickCache: null,

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

  setBrain: (brain) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(BRAIN_STORAGE_KEY, brain);
      } catch {}
    }
    set({ brain });
    get().addThoughtLog(
      brain === 'jev'
        ? { zh: '>>> 决策内核已切换：JEV 云端认知引擎（消耗配额）', en: '>>> DECISION CORE: JEV cloud cognitive engine (uses quota).' }
        : { zh: '>>> 决策内核已切换：本地启发式引擎（零消耗）', en: '>>> DECISION CORE: Local heuristic engine (free).' }
    );
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

    // Prefetch the Jev pick in the background so the upcoming execution
    // usually finds it already resolved instead of waiting 2-4s.
    const { brain, isEnabled } = get();
    const inScope = publicState.phase === 'PLAYER_TURN' || publicState.phase === 'SHOP';
    if (brain === 'jev' && isEnabled && inScope && evaluated.length > 0 && !isObviousDecision(evaluated)) {
      set({
        pickCache: {
          key: stateKeyForPick(publicState),
          promise: fetchAutopilotDecision(publicState),
        },
      });
    } else if (get().pickCache) {
      set({ pickCache: null });
    }
  },

  executeDecision: async (decision: AutopilotDecision, gameStoreActions: AutopilotGameActions, context?: ExecuteDecisionContext) => {
    const { isExecuting, speed, brain } = get();
    if (isExecuting) return;

    set({ isExecuting: true });
    try {
      let finalDecision = decision;

      // Jev brain: ask the server to pick among the current candidate lines.
      // DISMISS_TALLY is pure UI pacing and never needs a paid call. Runaway
      // candidates skip the pick too — same answer, zero quota.
      const candidates = get().decisions;
      if (brain === 'jev' && decision.type !== 'DISMISS_TALLY' && isObviousDecision(candidates)) {
        get().addThoughtLog({
          zh: `⚡ 最优线路显著（${candidates[0].confidence}%），本地直接执行 · 节省 1 次配额`,
          en: `⚡ Runaway top line (${candidates[0].confidence}%) — executed locally, 1 quota saved`,
        });
      } else if (brain === 'jev' && decision.type !== 'DISMISS_TALLY' && context?.publicState) {
        const cached = get().pickCache;
        set({ pickCache: null });
        const fromPrefetch = cached && cached.key === stateKeyForPick(context.publicState);

        get().addThoughtLog(
          fromPrefetch
            ? {
                zh: '🧠 JEV 裁决已就绪（预取命中），正在执行...',
                en: '🧠 JEV pick ready (prefetch hit), executing...',
              }
            : {
                zh: '🧠 JEV 认知决策请求已上行，等待最优线路裁决...',
                en: '🧠 JEV cognitive pick requested, awaiting optimal line...',
              }
        );
        const pick = fromPrefetch ? await cached.promise : await fetchAutopilotDecision(context.publicState);
        context.onJevMeta?.({ jevQuota: pick?.jevQuota, jevThrottled: pick?.jevThrottled });

        if (pick?.decision) {
          finalDecision = pick.decision;
          if (pick.jevPicked) {
            const conf = pick.jevConfidence != null ? Math.round(pick.jevConfidence * 100) : null;
            get().addThoughtLog({
              zh: `🧠 JEV 裁决 → ${finalDecision.titleZh || finalDecision.title}${conf != null ? `（置信度 ${conf}%）` : ''}`,
              en: `🧠 JEV picked → ${finalDecision.title}${conf != null ? ` (${conf}% confidence)` : ''}`,
            });
          } else if (pick.jevThrottled) {
            get().addThoughtLog({
              zh: '⚠️ JEV 配额耗尽，本次由本地启发式接管',
              en: '⚠️ JEV quota exhausted — local heuristic took this one',
            });
          } else if (pick.fallbackReason === 'no_api_key') {
            get().addThoughtLog({
              zh: '⚠️ JEV 云端引擎未配置，由本地启发式接管',
              en: '⚠️ JEV cloud engine not configured — local heuristic took over',
            });
          } else {
            get().addThoughtLog({
              zh: '⚠️ JEV 裁决失败（超时/异常），回退本地启发式线路',
              en: '⚠️ JEV pick failed (timeout/error) — fell back to heuristic line',
            });
          }
        } else {
          get().addThoughtLog({
            zh: '⚠️ JEV 决策通道不可用，回退本地启发式线路',
            en: '⚠️ JEV pick unavailable, falling back to heuristic line',
          });
        }
      }

      await runAutopilotDecision(finalDecision, gameStoreActions, speed, (log) => get().addThoughtLog(log));
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
