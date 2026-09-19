import { PublicGameState } from '../../game/types';
import { GameRunRecord, GameReplayStep, ReplayActionType, ReplayAutopilotSnapshot, ReplayScoreResult } from './types';
import { extractStateSnapshot, formatBlindName } from './snapshot';
import { ScoreCalculationResult, ScoreTallyStep } from '../../game/scoring/calculator';

export function buildBaseReplayStep(
  stepIndex: number,
  actionType: ReplayActionType,
  actionTitle: string,
  actionTitleZh: string,
  description: string,
  descriptionZh: string,
  publicState: PublicGameState,
  autopilotSnapshot?: ReplayAutopilotSnapshot,
  payload?: Record<string, unknown>
): GameReplayStep {
  const snapshot = extractStateSnapshot(publicState);
  return {
    stepIndex,
    timestamp: Date.now(),
    actionType,
    actionTitle,
    actionTitleZh,
    description,
    descriptionZh,
    stateSnapshot: snapshot,
    publicStateSnapshot: JSON.parse(JSON.stringify(publicState)),
    autopilotSnapshot: autopilotSnapshot ? JSON.parse(JSON.stringify(autopilotSnapshot)) : undefined,
    payload,
  };
}

export function formatReplayScore(scoreResult: ScoreCalculationResult | null | undefined): ReplayScoreResult | undefined {
  if (!scoreResult) return undefined;
  return {
    handType: scoreResult.evaluatedHand?.handType || 'HIGH_CARD',
    handTypeZh: scoreResult.evaluatedHand?.description || scoreResult.evaluatedHand?.handType,
    handLevel: scoreResult.handLevel || 1,
    baseChips: scoreResult.baseChips || 0,
    baseMult: scoreResult.baseMult || 0,
    totalChips: scoreResult.totalChips || 0,
    totalMult: scoreResult.totalMult || 0,
    finalScore: scoreResult.finalScore || 0,
    isModelBreak: scoreResult.isModelBreak,
    jokerTriggers: (scoreResult.tallySteps || [])
      .filter((s: ScoreTallyStep) => s.type === 'JOKER_TRIGGER')
      .map((s: ScoreTallyStep) => ({
        jokerKey: s.source,
        jokerName: s.source,
        message: s.message,
        chipsAdded: s.chipsAdded,
        multAdded: s.multAdded,
        xMult: s.xMult,
      })),
  };
}

export function createInitialRunRecord(
  publicState: PublicGameState,
  mode: 'roguelike' | 'classic' = 'roguelike',
  autopilotSnapshot?: ReplayAutopilotSnapshot
): GameRunRecord {
  const initStep = buildBaseReplayStep(
    1,
    'GAME_INIT',
    'Initial Deal',
    '开局发牌',
    `Dealt ${publicState.playerCards.length} initial cards. Ante: ${publicState.ante || 1}, Blind: ${formatBlindName(publicState.blind, 'en')}.`,
    `已发初始手牌 ${publicState.playerCards.length} 张。当前底注: Ante ${publicState.ante || 1}，目标盲注: ${formatBlindName(publicState.blind, 'zh')}。`,
    publicState,
    autopilotSnapshot
  );

  return {
    id: publicState.gameId,
    startTime: Date.now(),
    mode,
    status: 'IN_PROGRESS',
    version: 1,
    summary: {
      finalAnte: publicState.ante || 1,
      finalBlind: formatBlindName(publicState.blind, 'zh'),
      totalScore: 0,
      peakRoundScore: 0,
      totalHandsPlayed: 0,
      totalDiscards: 0,
      totalPurchases: 0,
      finalMoney: publicState.money || 4,
      jokersCount: (publicState.jokers || []) .length,
      modelBreaksCount: 0,
      jokersSnapshot: [...(publicState.jokers || [])],
    },
    steps: [initStep],
  };
}
