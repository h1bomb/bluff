import { PublicGameState, ScoreCalculationResult } from '../../game/types';
import { GameReplayStep } from './types';
import { evaluateAutopilotDecisions } from '@/game/autopilot/evaluator';

/**
 * Ensure a step has full fidelity state (synthesizing publicState & autopilot snapshot if missing from legacy records).
 */
export function ensureHighFidelityStep(step: GameReplayStep): GameReplayStep {
  if (!step) return step;

  let publicState: PublicGameState | undefined = step.publicStateSnapshot;
  if (!publicState && step.stateSnapshot) {
    const s = step.stateSnapshot;
    publicState = {
      gameId: 'replay_fallback',
      handIndex: 1,
      totalHands: 5,
      phase:
        step.actionType === 'BUY_ITEM'
          ? 'SHOP'
          : step.actionType === 'RUN_COMPLETE'
          ? 'RUN_COMPLETE'
          : 'PLAYER_TURN',
      pot: 0,
      currentBet: 0,
      playerChips: s.currentRoundScore || 0,
      playerCards: s.playerCards || [],
      playerFolded: false,
      aiName: s.blindType === 'BOSS' ? 'Reader Lv. ????' : 'Observer AI',
      aiIsBoss: s.blindType === 'BOSS',
      aiChips: 1000,
      aiCurrentBet: 0,
      aiCards: null,
      aiFolded: false,
      aiVisualState: 'IDLE',
      aiUnderstanding: 150,
      activeBuffs: [],
      pendingEvents: [],
      modelBreaksCount: 0,
      ante: s.ante || 1,
      blind: {
        ante: s.ante || 1,
        blindType: s.blindType || 'SMALL',
        targetScore: s.targetScore || 300,
        rewardMoney: 3,
        bossName: s.blindType === 'BOSS' ? s.blindName : undefined,
      },
      currentRoundScore: s.currentRoundScore || 0,
      targetScore: s.targetScore || 300,
      handsLeft: s.handsLeft ?? 4,
      discardsLeft: s.discardsLeft ?? 3,
      money: s.money ?? 0,
      jokers: s.jokers || [],
      selectedCardIds: s.selectedCardIds || [],
      handLevels: s.handLevels,
      shopInventory: s.shopInventory,
      lastScoreResult: step.payload?.scoreResult as ScoreCalculationResult | undefined,
    };
  }

  let autopilotSnapshot = step.autopilotSnapshot;
  if (!autopilotSnapshot && publicState) {
    try {
      const simulatedDecisions = evaluateAutopilotDecisions(publicState, publicState.shopInventory);
      autopilotSnapshot = {
        isEnabled: true,
        speed: '1x',
        decisions: simulatedDecisions,
        thoughtLogs: [
          {
            timestamp: new Date(step.timestamp).toLocaleTimeString(),
            zh: '回放遥测数据已接管',
            en: 'REPLAY TELEMETRY SYNTHESIS ENGAGED',
          },
          {
            timestamp: new Date(step.timestamp).toLocaleTimeString(),
            zh: `动作: ${step.actionTitleZh || step.actionTitle} | 评估了 ${simulatedDecisions.length} 条分支路径`,
            en: `Action: ${step.actionTitle} | Evaluated ${simulatedDecisions.length} candidate paths.`,
          },
        ],
        topDecisionConfidence: simulatedDecisions[0]?.confidence,
        topDecisionTitle: simulatedDecisions[0]?.title,
      };
    } catch {
      autopilotSnapshot = {
        isEnabled: false,
        speed: '1x',
        decisions: [],
        thoughtLogs: [
          {
            zh: `[REPLAY] 历史动作: ${step.actionTitleZh || step.actionTitle}`,
            en: `[REPLAY] Historical action: ${step.actionTitle}`,
          },
        ],
      };
    }
  }

  return {
    ...step,
    publicStateSnapshot: publicState,
    autopilotSnapshot,
  };
}
