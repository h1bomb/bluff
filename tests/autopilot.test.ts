import { describe, it, expect } from 'vitest';
import { evaluateAutopilotDecisions } from '../src/game/autopilot/evaluator';
import { PublicGameState } from '../src/game/types';

describe('Autopilot Decision Evaluator', () => {
  it('identifies best hand and sets high confidence for winning hand', () => {
    const mockState: PublicGameState = {
      gameId: 'test_game',
      handIndex: 1,
      totalHands: 5,
      phase: 'PLAYER_TURN',
      pot: 40,
      currentBet: 20,
      playerChips: 200,
      playerCards: [
        { id: 'c1', suit: '♠', rank: 14 },
        { id: 'c2', suit: '♠', rank: 13 },
        { id: 'c3', suit: '♠', rank: 12 },
        { id: 'c4', suit: '♠', rank: 11 },
        { id: 'c5', suit: '♠', rank: 10 }, // Straight flush
        { id: 'c6', suit: '♦', rank: 2 },
        { id: 'c7', suit: '♣', rank: 4 },
        { id: 'c8', suit: '♥', rank: 7 },
      ],
      playerFolded: false,
      aiName: 'THE READER',
      aiIsBoss: false,
      aiChips: 200,
      aiCurrentBet: 20,
      aiCards: null,
      aiFolded: false,
      aiVisualState: 'IDLE',
      aiUnderstanding: 0,
      activeBuffs: [],
      pendingEvents: [],
      modelBreaksCount: 0,
      targetScore: 300,
      currentRoundScore: 0,
      handsLeft: 4,
      discardsLeft: 3,
      money: 10,
      jokers: [],
      selectedCardIds: [],
    };

    const decisions = evaluateAutopilotDecisions(mockState);
    expect(decisions.length).toBeGreaterThan(0);
    const topDecision = decisions[0];
    expect(topDecision.type).toBe('PLAY_HAND');
    expect(topDecision.cardIds).toEqual(['c1', 'c2', 'c3', 'c4', 'c5']);
    expect(topDecision.confidence).toBeGreaterThanOrEqual(90);
  });

  it('suggests discard when hand needs improvement', () => {
    const mockState: PublicGameState = {
      gameId: 'test_game',
      handIndex: 1,
      totalHands: 5,
      phase: 'PLAYER_TURN',
      pot: 40,
      currentBet: 20,
      playerChips: 200,
      playerCards: [
        { id: 'c1', suit: '♠', rank: 10 },
        { id: 'c2', suit: '♠', rank: 9 },
        { id: 'c3', suit: '♠', rank: 5 },
        { id: 'c4', suit: '♦', rank: 2 },
        { id: 'c5', suit: '♣', rank: 3 },
        { id: 'c6', suit: '♥', rank: 4 },
      ],
      playerFolded: false,
      aiName: 'THE READER',
      aiIsBoss: false,
      aiChips: 200,
      aiCurrentBet: 20,
      aiCards: null,
      aiFolded: false,
      aiVisualState: 'IDLE',
      aiUnderstanding: 0,
      activeBuffs: [],
      pendingEvents: [],
      modelBreaksCount: 0,
      targetScore: 500,
      currentRoundScore: 0,
      handsLeft: 4,
      discardsLeft: 3,
      money: 10,
      jokers: [],
      selectedCardIds: [],
    };

    const decisions = evaluateAutopilotDecisions(mockState);
    const discardDecision = decisions.find((d) => d.type === 'DISCARD');
    expect(discardDecision).toBeDefined();
    expect(discardDecision?.cards?.length).toBeGreaterThan(0);
  });

  it('evaluates shop choices properly in SHOP phase', () => {
    const mockState: PublicGameState = {
      gameId: 'test_game',
      handIndex: 1,
      totalHands: 5,
      phase: 'SHOP',
      pot: 40,
      currentBet: 20,
      playerChips: 200,
      playerCards: [],
      playerFolded: false,
      aiName: 'THE READER',
      aiIsBoss: false,
      aiChips: 200,
      aiCurrentBet: 20,
      aiCards: null,
      aiFolded: false,
      aiVisualState: 'IDLE',
      aiUnderstanding: 0,
      activeBuffs: [],
      pendingEvents: [],
      modelBreaksCount: 0,
      money: 15,
      jokers: [],
      maxJokers: 5,
    };

    const mockInventory = [
      {
        id: 'shop_1',
        itemType: 'JOKER' as const,
        name: "Pavlov's Bell",
        nameZh: '巴甫洛夫之铃',
        description: 'Fast hands grant chips',
        descriptionZh: '快速出牌获得筹码',
        cost: 5,
        icon: '🔔',
        payload: { jokerKey: 'pavlov_bell' },
      },
    ];

    const decisions = evaluateAutopilotDecisions(mockState, mockInventory);
    expect(decisions.length).toBeGreaterThan(0);
    const buyDecision = decisions.find((d) => d.type === 'BUY_ITEM');
    expect(buyDecision).toBeDefined();
    expect(buyDecision?.confidence).toBeGreaterThanOrEqual(70);
  });

  it('reads shopInventory from publicState directly and suggests NEXT_BLIND when funds depleted', () => {
    const mockState: PublicGameState = {
      gameId: 'test_game',
      handIndex: 1,
      totalHands: 5,
      phase: 'SHOP',
      pot: 40,
      currentBet: 20,
      playerChips: 200,
      playerCards: [],
      playerFolded: false,
      aiName: 'THE READER',
      aiIsBoss: false,
      aiChips: 200,
      aiCurrentBet: 20,
      aiCards: null,
      aiFolded: false,
      aiVisualState: 'IDLE',
      aiUnderstanding: 0,
      activeBuffs: [],
      pendingEvents: [],
      modelBreaksCount: 0,
      money: 2,
      jokers: [],
      maxJokers: 5,
      shopInventory: [
        {
          id: 'shop_1',
          itemType: 'JOKER',
          name: "Pavlov's Bell",
          nameZh: '巴甫洛夫之铃',
          description: 'Fast hands grant chips',
          descriptionZh: '快速出牌获得筹码',
          cost: 5,
          icon: '🔔',
          payload: { jokerKey: 'pavlov_bell' },
        },
      ],
    };

    const decisions = evaluateAutopilotDecisions(mockState);
    expect(decisions.length).toBeGreaterThan(0);
    const topDecision = decisions[0];
    expect(topDecision.type).toBe('NEXT_BLIND');
    expect(topDecision.confidence).toBe(98);
  });

  it('suggests REROLL_SHOP when player has excess funds over $25 interest cap', () => {
    const mockState: PublicGameState = {
      gameId: 'test_game',
      handIndex: 1,
      totalHands: 5,
      phase: 'SHOP',
      pot: 40,
      currentBet: 20,
      playerChips: 200,
      playerCards: [],
      playerFolded: false,
      aiName: 'THE READER',
      aiIsBoss: false,
      aiChips: 200,
      aiCurrentBet: 20,
      aiCards: null,
      aiFolded: false,
      aiVisualState: 'IDLE',
      aiUnderstanding: 0,
      activeBuffs: [],
      pendingEvents: [],
      modelBreaksCount: 0,
      money: 45, // well above $25
      rerollCost: 2,
      jokers: [],
      maxJokers: 5,
      shopInventory: [],
    };

    const decisions = evaluateAutopilotDecisions(mockState);
    const rerollDecision = decisions.find((d) => d.type === 'REROLL_SHOP');
    expect(rerollDecision).toBeDefined();
    expect(rerollDecision?.confidence).toBeGreaterThanOrEqual(80);
  });

  it('suggests SELL_JOKER when slots are full and a top-tier X-Mult joker appears in shop', () => {
    const mockState: PublicGameState = {
      gameId: 'test_game',
      handIndex: 1,
      totalHands: 5,
      phase: 'SHOP',
      pot: 40,
      currentBet: 20,
      playerChips: 200,
      playerCards: [],
      playerFolded: false,
      aiName: 'THE READER',
      aiIsBoss: false,
      aiChips: 200,
      aiCurrentBet: 20,
      aiCards: null,
      aiFolded: false,
      aiVisualState: 'IDLE',
      aiUnderstanding: 0,
      activeBuffs: [],
      pendingEvents: [],
      modelBreaksCount: 0,
      money: 12,
      jokers: [
        { id: 'j1', jokerKey: 'PAVLOVS_BELL', name: 'Pavlov', nameZh: '巴甫洛夫之铃', description: '', descriptionZh: '', rarity: 'COMMON', cost: 4, sellValue: 2, icon: '🔔' },
        { id: 'j2', jokerKey: 'RED_PILL', name: 'Red Pill', nameZh: '红药丸', description: '', descriptionZh: '', rarity: 'COMMON', cost: 4, sellValue: 2, icon: '💊' },
        { id: 'j3', jokerKey: 'BLACK_ICE', name: 'Black ICE', nameZh: '黑冰防御', description: '', descriptionZh: '', rarity: 'COMMON', cost: 4, sellValue: 2, icon: '🧊' },
        { id: 'j4', jokerKey: 'POKER_FACE', name: 'Poker Face', nameZh: '扑克脸', description: '', descriptionZh: '', rarity: 'COMMON', cost: 4, sellValue: 2, icon: '🗿' },
        { id: 'j5', jokerKey: 'SMOKE_SCREEN', name: 'Smoke', nameZh: '烟雾弹', description: '', descriptionZh: '', rarity: 'UNCOMMON', cost: 5, sellValue: 2, icon: '💨' },
      ],
      maxJokers: 5,
    };

    const mockInventory = [
      {
        id: 'shop_neural',
        itemType: 'JOKER' as const,
        name: 'Neural Feedback',
        nameZh: '神经反馈',
        description: 'Face cards grant x1.3 Mult',
        descriptionZh: '人头牌提供 x1.3 倍率',
        cost: 8,
        icon: '🧠',
        payload: { jokerKey: 'NEURAL_FEEDBACK' },
      },
    ];

    const decisions = evaluateAutopilotDecisions(mockState, mockInventory);
    const sellDecision = decisions.find((d) => d.type === 'SELL_JOKER');
    expect(sellDecision).toBeDefined();
    expect(sellDecision?.confidence).toBeGreaterThanOrEqual(85);
  });

  it('prioritizes DISCARD over weak PLAY_HAND when holding high card and cannot clear target', () => {
    const mockState: PublicGameState = {
      gameId: 'test_game',
      handIndex: 1,
      totalHands: 5,
      phase: 'PLAYER_TURN',
      pot: 40,
      currentBet: 20,
      playerChips: 200,
      playerCards: [
        { id: 'c1', suit: '♠', rank: 9 },
        { id: 'c2', suit: '♥', rank: 7 },
        { id: 'c3', suit: '♦', rank: 4 },
        { id: 'c4', suit: '♣', rank: 2 },
        { id: 'c5', suit: '♠', rank: 11 },
        { id: 'c6', suit: '♦', rank: 6 },
      ],
      playerFolded: false,
      aiName: 'THE READER',
      aiIsBoss: false,
      aiChips: 200,
      aiCurrentBet: 20,
      aiCards: null,
      aiFolded: false,
      aiVisualState: 'IDLE',
      aiUnderstanding: 0,
      activeBuffs: [],
      pendingEvents: [],
      modelBreaksCount: 0,
      targetScore: 2000,
      currentRoundScore: 0,
      handsLeft: 4,
      discardsLeft: 3,
      money: 10,
      jokers: [],
      selectedCardIds: [],
    };

    const decisions = evaluateAutopilotDecisions(mockState);
    expect(decisions[0].type).toBe('DISCARD');
    expect(decisions[0].confidence).toBeGreaterThan(90);
  });
});
