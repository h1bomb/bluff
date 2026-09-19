import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveGameRun,
  getGameRun,
  getAllGameRuns,
  clearAllGameRuns,
  appendReplayStep,
  exportRunToJson,
  importRunFromJson,
  saveActiveSession,
  getActiveSession,
  clearActiveSession,
} from '../src/lib/history/db';
import {
  createInitialRunRecord,
  createPlayHandStep,
  createDiscardStep,
  createBuyItemStep,
  createGameOverStep,
  ensureHighFidelityStep,
} from '../src/lib/history/recorder';
import { PublicGameState, Card, ScoreCalculationResult } from '../src/game/types';
import { ShopItem } from '../src/game/shop/types';

describe('Game History & Replay System', () => {
  beforeEach(async () => {
    await clearAllGameRuns();
    await clearActiveSession();
  });

  const mockPublicState: PublicGameState = {
    gameId: 'test_run_123',
    handIndex: 1,
    totalHands: 5,
    phase: 'PLAYER_TURN',
    pot: 100,
    currentBet: 10,
    playerChips: 200,
    playerCards: [
      { id: 'c1', suit: '♠', rank: 14 },
      { id: 'c2', suit: '♠', rank: 13 },
      { id: 'c3', suit: '♠', rank: 12 },
      { id: 'c4', suit: '♥', rank: 7 },
      { id: 'c5', suit: '♦', rank: 6 },
      { id: 'c6', suit: '♣', rank: 5 },
    ],
    playerFolded: false,
    aiName: 'Observer AI',
    aiIsBoss: false,
    aiChips: 200,
    aiCurrentBet: 10,
    aiCards: null,
    aiFolded: false,
    aiVisualState: 'IDLE',
    aiUnderstanding: 20,
    activeBuffs: [],
    pendingEvents: [],
    modelBreaksCount: 0,
    ante: 1,
    blind: {
      ante: 1,
      blindType: 'SMALL',
      targetScore: 300,
      rewardMoney: 3,
    },
    currentRoundScore: 0,
    targetScore: 300,
    handsLeft: 4,
    discardsLeft: 3,
    money: 4,
    jokers: [],
    selectedCardIds: ['c1', 'c2', 'c3'],
  };

  it('creates initial run record with complete snapshot', async () => {
    const run = createInitialRunRecord(mockPublicState, 'roguelike');

    expect(run.id).toBe('test_run_123');
    expect(run.status).toBe('IN_PROGRESS');
    expect(run.steps.length).toBe(1);
    expect(run.steps[0].actionType).toBe('GAME_INIT');
    expect(run.steps[0].stateSnapshot.playerCards.length).toBe(6);
    expect(run.summary.finalAnte).toBe(1);
    expect(run.summary.totalScore).toBe(0);

    await saveGameRun(run);
    const retrieved = await getGameRun('test_run_123');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe('test_run_123');
  });

  it('appends play hand step and accumulates scoring summary', async () => {
    const run = createInitialRunRecord(mockPublicState, 'roguelike');
    await saveGameRun(run);

    const playedCards: Card[] = [
      { id: 'c1', suit: '♠', rank: 14 },
      { id: 'c2', suit: '♠', rank: 13 },
      { id: 'c3', suit: '♠', rank: 12 },
    ];

    const mockScoreResult: ScoreCalculationResult = {
      evaluatedHand: {
        cards: playedCards,
        handType: 'STRAIGHT_FLUSH',
        strength: 5,
        score: 100,
        description: '顺金',
      },
      handLevel: 1,
      baseChips: 100,
      baseMult: 8,
      totalChips: 100,
      totalMult: 8,
      cognitiveMult: 1.0,
      isModelBreak: false,
      modelBreakBonus: 0,
      finalScore: 800,
      tallySteps: [
        {
          type: 'HAND_BASE',
          source: 'STRAIGHT_FLUSH',
          currentChips: 100,
          currentMult: 8,
          currentCognitiveMult: 1.0,
          message: 'Base score',
        },
      ],
    };

    const updatedState = {
      ...mockPublicState,
      currentRoundScore: 800,
      handsLeft: 3,
    };

    const playStep = createPlayHandStep(2, playedCards, mockScoreResult, updatedState);
    await appendReplayStep(
      run.id,
      playStep,
      {
        totalScore: 800,
        peakRoundScore: 800,
        totalHandsPlayed: 1,
      }
    );

    const updatedRun = await getGameRun(run.id);
    expect(updatedRun?.steps.length).toBe(2);
    expect(updatedRun?.steps[1].actionType).toBe('PLAY_HAND');
    expect(updatedRun?.steps[1].payload?.scoreResult?.finalScore).toBe(800);
    expect(updatedRun?.summary.totalScore).toBe(800);
    expect(updatedRun?.summary.peakRoundScore).toBe(800);
    expect(updatedRun?.summary.totalHandsPlayed).toBe(1);
  });

  it('records discard and shop purchase steps', async () => {
    const run = createInitialRunRecord(mockPublicState, 'roguelike');
    await saveGameRun(run);

    // Discard step
    const discardedCards: Card[] = [{ id: 'c4', suit: '♥', rank: 7 }];
    const discardStep = createDiscardStep(2, discardedCards, { ...mockPublicState, discardsLeft: 2 });
    await appendReplayStep(run.id, discardStep, { totalDiscards: 1 });

    // Shop purchase step
    const mockJoker: ShopItem = {
      id: 'shop_joker_1',
      name: "Pavlov's Bell",
      nameZh: '巴甫洛夫之铃',
      description: '',
      descriptionZh: '',
      cost: 4,
      itemType: 'JOKER',
      icon: '🔔',
      payload: { jokerKey: 'PAVLOVS_BELL' },
    };
    const buyStep = createBuyItemStep(3, mockJoker, { ...mockPublicState, money: 0 });
    await appendReplayStep(run.id, buyStep, { totalPurchases: 1, finalMoney: 0 });

    const updatedRun = await getGameRun(run.id);
    expect(updatedRun?.steps.length).toBe(3);
    expect(updatedRun?.summary.totalDiscards).toBe(1);
    expect(updatedRun?.summary.totalPurchases).toBe(1);
    expect(updatedRun?.steps[2].actionType).toBe('BUY_ITEM');
    expect(updatedRun?.steps[2].payload?.boughtItem?.name).toBe("Pavlov's Bell");
  });

  it('correctly finalizes victory or defeat status', async () => {
    const run = createInitialRunRecord(mockPublicState, 'roguelike');
    await saveGameRun(run);

    const gameOverStep = createGameOverStep(2, true, mockPublicState);
    await appendReplayStep(run.id, gameOverStep, undefined, 'VICTORY');

    const finalizedRun = await getGameRun(run.id);
    expect(finalizedRun?.status).toBe('VICTORY');
    expect(finalizedRun?.endTime).toBeDefined();
    expect(finalizedRun?.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('exports to JSON and imports back with full fidelity', async () => {
    const run = createInitialRunRecord(mockPublicState, 'roguelike');
    await saveGameRun(run);

    const jsonStr = exportRunToJson(run);
    expect(typeof jsonStr).toBe('string');
    expect(jsonStr).toContain('test_run_123');

    await clearAllGameRuns();
    const emptyList = await getAllGameRuns();
    expect(emptyList.length).toBe(0);

    const imported = await importRunFromJson(jsonStr);
    expect(imported.id).toBe('test_run_123');
    expect(imported.steps.length).toBe(1);

    const reloaded = await getGameRun('test_run_123');
    expect(reloaded).not.toBeNull();
    expect(reloaded?.id).toBe('test_run_123');
  });

  it('saves, retrieves, and clears active game session for reload continuity', async () => {
    const activeRun = createInitialRunRecord(mockPublicState, 'roguelike');
    await saveActiveSession({
      gameId: mockPublicState.gameId,
      publicState: mockPublicState,
      sequence: 1,
      replayRun: activeRun,
      lastUpdated: Date.now(),
    });

    const active = await getActiveSession();
    expect(active).not.toBeNull();
    expect(active?.gameId).toBe('test_run_123');
    expect(active?.publicState.money).toBe(4);
    expect(active?.replayRun.steps.length).toBe(1);

    await clearActiveSession();
    const afterClear = await getActiveSession();
    expect(afterClear).toBeNull();
  });

  it('only records completed runs (VICTORY or DEFEAT) in history, excluding IN_PROGRESS', async () => {
    // 1. Save an in-progress run
    const inProgressRun = createInitialRunRecord(mockPublicState, 'roguelike');
    await saveGameRun(inProgressRun);

    // getAllGameRuns should filter out in-progress runs
    const runs1 = await getAllGameRuns();
    expect(runs1.length).toBe(0);

    // 2. Save a defeat run
    const defeatRun = {
      ...inProgressRun,
      id: 'run_defeat_456',
      status: 'DEFEAT' as const,
      endTime: Date.now(),
      durationMs: 15000,
    };
    await saveGameRun(defeatRun);

    // 3. Save a victory run
    const victoryRun = {
      ...inProgressRun,
      id: 'run_victory_789',
      status: 'VICTORY' as const,
      endTime: Date.now(),
      durationMs: 30000,
    };
    await saveGameRun(victoryRun);

    const runs2 = await getAllGameRuns();
    expect(runs2.length).toBe(2);
    expect(runs2.map(r => r.id)).toEqual(expect.arrayContaining(['run_defeat_456', 'run_victory_789']));
    expect(runs2.some(r => r.status === 'IN_PROGRESS')).toBe(false);
  });

  it('records full publicStateSnapshot and autopilot telemetry in replay steps with JSON fidelity', async () => {
    const mockAutopilot = {
      isEnabled: true,
      speed: '1x' as const,
      decisions: [
        {
          id: 'dec_1',
          type: 'PLAY_HAND' as const,
          category: 'BEST' as const,
          title: 'Straight Flush',
          titleZh: '顺金',
          subtitle: 'Score +850',
          subtitleZh: '预计得分 +850',
          confidence: 94,
          simulatedDelayMs: 450,
          reasoning: 'Optimal play',
          reasoningZh: '一击突破盲注',
        },
      ],
      thoughtLogs: ['[12:00:00] Initialized telemetry'],
      topDecisionConfidence: 94,
      topDecisionTitle: 'Straight Flush',
    };

    const run = createInitialRunRecord(mockPublicState, 'roguelike', mockAutopilot);
    expect(run.steps[0].publicStateSnapshot).toBeDefined();
    expect(run.steps[0].publicStateSnapshot?.ante).toBe(1);
    expect(run.steps[0].publicStateSnapshot?.playerCards.length).toBe(6);
    expect(run.steps[0].autopilotSnapshot).toBeDefined();
    expect(run.steps[0].autopilotSnapshot?.isEnabled).toBe(true);
    expect(run.steps[0].autopilotSnapshot?.decisions[0].confidence).toBe(94);

    // Export to JSON and import back
    const json = exportRunToJson(run);
    const restored = await importRunFromJson(json);
    expect(restored.steps[0].publicStateSnapshot).toBeDefined();
    expect(restored.steps[0].publicStateSnapshot?.ante).toBe(1);
    expect(restored.steps[0].autopilotSnapshot?.decisions[0].titleZh).toBe('顺金');
  });

  it('gracefully synthesizes high-fidelity state and autopilot telemetry for legacy steps', () => {
    // Create a legacy step that only has stateSnapshot and no publicStateSnapshot or autopilotSnapshot
    const legacyStep = {
      stepIndex: 1,
      timestamp: Date.now(),
      actionType: 'PLAY_HAND' as const,
      actionTitle: 'Play Hand',
      actionTitleZh: '出牌',
      description: 'Played 3 cards',
      descriptionZh: '打出 3 张牌',
      stateSnapshot: {
        ante: 2,
        blindName: '大盲注',
        blindType: 'BIG' as const,
        targetScore: 450,
        currentRoundScore: 200,
        handsLeft: 3,
        discardsLeft: 2,
        money: 6,
        playerCards: mockPublicState.playerCards,
        selectedCardIds: ['c1', 'c2', 'c3'],
        jokers: [],
      },
    };

    const enhanced = ensureHighFidelityStep(legacyStep);
    expect(enhanced.publicStateSnapshot).toBeDefined();
    expect(enhanced.publicStateSnapshot?.ante).toBe(2);
    expect(enhanced.publicStateSnapshot?.handsLeft).toBe(3);
    expect(enhanced.publicStateSnapshot?.playerCards.length).toBe(6);

    expect(enhanced.autopilotSnapshot).toBeDefined();
    expect(enhanced.autopilotSnapshot?.decisions.length).toBeGreaterThan(0);
    expect(enhanced.autopilotSnapshot?.thoughtLogs.length).toBeGreaterThan(0);
  });

  it('safely normalizes legacy run records where finalBlind is an object with name and ability', async () => {
    // Simulate a corrupted or legacy record in storage where finalBlind is an object
    const corruptedRun = {
      id: 'legacy_corrupted_run_1',
      startTime: Date.now() - 60000,
      endTime: Date.now(),
      durationMs: 60000,
      mode: 'roguelike' as const,
      status: 'VICTORY' as const,
      version: 1,
      summary: {
        finalAnte: 3,
        finalBlind: {
          name: 'THE CYNIC',
          ability: 'Deeply suspicious, aggressively calls bluffs with elevated confidence',
        } as unknown as string,
        totalScore: 5000,
        peakRoundScore: 2500,
        totalHandsPlayed: 6,
        totalDiscards: 4,
        totalPurchases: 2,
        finalMoney: 8,
        jokersCount: 2,
        modelBreaksCount: 1,
        jokersSnapshot: [],
      },
      steps: [],
    };

    await saveGameRun(corruptedRun as unknown as Parameters<typeof saveGameRun>[0]);

    // Verify getGameRun normalizes finalBlind to a string
    const retrieved = await getGameRun('legacy_corrupted_run_1');
    expect(retrieved).not.toBeNull();
    expect(typeof retrieved?.summary.finalBlind).toBe('string');
    expect(retrieved?.summary.finalBlind).toBe('THE CYNIC');

    // Verify getAllGameRuns normalizes all records
    const allRuns = await getAllGameRuns();
    expect(allRuns.length).toBe(1);
    expect(typeof allRuns[0].summary.finalBlind).toBe('string');
    expect(allRuns[0].summary.finalBlind).toBe('THE CYNIC');

    // Verify importRunFromJson also normalizes
    const jsonStr = JSON.stringify(corruptedRun);
    const imported = await importRunFromJson(jsonStr);
    expect(typeof imported.summary.finalBlind).toBe('string');
    expect(imported.summary.finalBlind).toBe('THE CYNIC');
  });
});
