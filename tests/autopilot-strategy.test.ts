import { describe, it, expect } from 'vitest';
import { evaluateAutopilotDecisions, isObviousDecision } from '../src/game/autopilot/evaluator';
import { evaluateDiscardDecisions } from '../src/game/autopilot/evaluators/discard-evaluator';
import { evaluateShopDecisions } from '../src/game/autopilot/evaluators/shop-evaluator';
import { calculateHandScore } from '../src/game/scoring/calculator';
import { DEFAULT_HAND_LEVELS } from '../src/game/poker/hands-levels';
import { Card, PublicGameState, PlayerBelief } from '../src/game/types';
import { ShopItem } from '../src/game/shop/types';
import { JokerInstance } from '../src/game/jokers/types';

let idSeq = 0;
const c = (suit: Card['suit'], rank: number): Card => ({ id: `tc${++idSeq}`, suit, rank });

function makeState(overrides: Partial<PublicGameState> = {}): PublicGameState {
  return {
    gameId: 'test_game',
    handIndex: 1,
    totalHands: 5,
    phase: 'PLAYER_TURN',
    pot: 0,
    currentBet: 0,
    playerChips: 100,
    playerCards: [],
    playerFolded: false,
    aiName: 'THE READER',
    aiIsBoss: false,
    aiChips: 100,
    aiCurrentBet: 0,
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
    handLevels: DEFAULT_HAND_LEVELS,
    selectedCardIds: [],
    ...overrides,
  };
}

function overconfidentBelief(): PlayerBelief {
  return {
    behavior: {
      value: 'GENUINE_STRONG',
      probabilities: { GENUINE_STRONG: 0.9, CALCULATED_BLUFF: 0.05, TEMPO_MANIPULATION: 0.03, DESPERATION_DIG: 0.02 },
      confidence: 0.9,
    },
    bluff: 0.1,
    baiting: 0.1,
    reversePrediction: 0.1,
    aggression: 0.5,
    predictability: 0.8,
    tilt: 0.1,
  };
}

const jokerItem = (key: string, cost = 5): ShopItem => ({
  id: `shop_${key}`,
  itemType: 'JOKER',
  name: key,
  nameZh: key,
  description: '',
  descriptionZh: '',
  cost,
  icon: '🃏',
  payload: { jokerKey: key },
});

const jokerInst = (key: string): JokerInstance => ({
  id: `j_${key}`,
  jokerKey: key,
  name: key,
  nameZh: key,
  description: '',
  descriptionZh: '',
  rarity: 'COMMON',
  cost: 4,
  sellValue: 2,
  icon: '🃏',
});

describe('Play strategy: dump hands', () => {
  // Pair of aces + junk, target unreachable, no discards left:
  // optimal is to dump junk (redraw) and keep the pair core for next hand.
  it('dumps junk and keeps the pair core when nothing can clear and no discards remain', () => {
    const ace1 = c('♠', 14);
    const ace2 = c('♥', 14);
    const state = makeState({
      targetScore: 99999,
      discardsLeft: 0,
      handsLeft: 4,
      playerCards: [ace1, ace2, c('♣', 2), c('♦', 5), c('♠', 7), c('♥', 8), c('♣', 9), c('♦', 11)],
    });

    const decisions = evaluateAutopilotDecisions(state);
    const top = decisions[0];
    expect(top.type).toBe('PLAY_HAND');
    expect(top.category).toBe('GREED');
    expect(top.cardIds).toBeDefined();
    expect(top.cardIds!.length).toBeGreaterThanOrEqual(3);
    expect(top.cardIds!).not.toContain(ace1.id);
    expect(top.cardIds!).not.toContain(ace2.id);
  });

  it('does not dump when discards are still available (discard digs for free)', () => {
    const state = makeState({
      targetScore: 99999,
      discardsLeft: 3,
      handsLeft: 4,
      playerCards: [c('♠', 14), c('♥', 14), c('♣', 2), c('♦', 5), c('♠', 7), c('♥', 8), c('♣', 9), c('♦', 11)],
    });
    const decisions = evaluateAutopilotDecisions(state);
    expect(decisions.every((d) => !(d.type === 'PLAY_HAND' && d.category === 'GREED'))).toBe(true);
  });

  it('does not dump when the best combo already clears the blind', () => {
    const state = makeState({
      targetScore: 100,
      discardsLeft: 0,
      handsLeft: 4,
      playerCards: [c('♠', 14), c('♠', 13), c('♠', 12), c('♠', 11), c('♠', 10), c('♦', 2), c('♣', 3), c('♥', 4)],
    });
    const decisions = evaluateAutopilotDecisions(state);
    expect(decisions[0].category).toBe('BEST');
    expect(decisions.every((d) => d.category !== 'GREED' || d.type !== 'PLAY_HAND')).toBe(true);
  });

  it('scores combos purely from calculateHandScore without double-counted joker bonuses', () => {
    const cards = [c('♥', 14), c('♦', 13), c('♥', 12), c('♣', 2), c('♠', 3), c('♣', 4), c('♦', 7), c('♠', 9)];
    const state = makeState({
      targetScore: 99999,
      discardsLeft: 2,
      jokers: [jokerInst('RED_PILL')],
      playerCards: cards,
    });
    const decisions = evaluateAutopilotDecisions(state);
    const best = decisions.find((d) => d.type === 'PLAY_HAND' && d.category === 'BEST');
    expect(best).toBeDefined();
    const reference = calculateHandScore({
      handCards: cards.filter((card) => best!.cardIds!.includes(card.id)),
      handLevels: DEFAULT_HAND_LEVELS,
      jokers: [jokerInst('RED_PILL')],
      belief: undefined,
      actionDelayMs: 650,
      consecutiveActions: [],
      discardedHistory: [],
    });
    expect(best!.expectedScore).toBe(reference.finalScore);
  });
});

describe('Play strategy: bluff gating', () => {
  const flushHand = () => [c('♠', 14), c('♠', 13), c('♠', 12), c('♠', 11), c('♠', 10), c('♦', 2), c('♣', 3), c('♥', 4)];

  it('suppresses the bluff option when a guaranteed clear exists', () => {
    const state = makeState({
      belief: overconfidentBelief(),
      targetScore: 100,
      discardsLeft: 0,
      playerCards: flushHand(),
    });
    const decisions = evaluateAutopilotDecisions(state);
    expect(decisions.every((d) => d.category !== 'BLUFF')).toBe(true);
    expect(decisions[0].category).toBe('BEST');
  });

  it('offers the bluff when behind and the AI is overconfident', () => {
    const state = makeState({
      belief: overconfidentBelief(),
      targetScore: 99999,
      discardsLeft: 3,
      playerCards: flushHand(),
    });
    const decisions = evaluateAutopilotDecisions(state);
    const bluff = decisions.find((d) => d.category === 'BLUFF');
    expect(bluff).toBeDefined();
    // Expected score should come from the real (already cognitive-multiplied)
    // score of the weak combo, not an arbitrary 8x multiplier.
    expect(bluff!.expectedScore).toBeGreaterThan(0);
  });

  it('suppresses the bluff when the AI already smells the bluff', () => {
    const belief = overconfidentBelief();
    belief.bluff = 0.6;
    const state = makeState({
      belief,
      targetScore: 99999,
      discardsLeft: 3,
      playerCards: flushHand(),
    });
    const decisions = evaluateAutopilotDecisions(state);
    expect(decisions.every((d) => d.category !== 'BLUFF')).toBe(true);
  });
});

describe('Discard strategy: draw protection', () => {
  it('keeps low straight runs instead of dumping them', () => {
    const four = c('♣', 4);
    const five = c('♥', 5);
    const six = c('♦', 6);
    const nine = c('♠', 9);
    const two = c('♠', 2);
    const state = makeState({
      playerCards: [four, five, six, nine, c('♥', 12), c('♣', 11), two, c('♦', 13)],
    });

    const decisions = evaluateDiscardDecisions(state);
    expect(decisions.length).toBeGreaterThan(0);
    const sel = decisions[0].cardIds!;
    expect(sel).not.toContain(four.id);
    expect(sel).not.toContain(five.id);
    expect(sel).not.toContain(six.id);
    expect(sel).toContain(nine.id);
    expect(sel).toContain(two.id);
  });
});

describe('Obvious-decision quota saver', () => {
  const dec = (confidence: number) =>
    ({
      id: `d${confidence}`,
      type: 'PLAY_HAND',
      category: 'BEST',
      title: '',
      titleZh: '',
      subtitle: '',
      subtitleZh: '',
      confidence,
      simulatedDelayMs: 500,
      reasoning: '',
      reasoningZh: '',
    }) as const;

  it('flags runaway top lines as obvious', () => {
    expect(isObviousDecision([dec(98), dec(40), dec(30)])).toBe(true);
    expect(isObviousDecision([dec(95), dec(65)])).toBe(true);
  });

  it('does not flag close races or sub-95 tops', () => {
    expect(isObviousDecision([dec(98), dec(80)])).toBe(false);
    expect(isObviousDecision([dec(90), dec(30)])).toBe(false);
    expect(isObviousDecision([dec(95)])).toBe(true);
    expect(isObviousDecision([])).toBe(false);
  });
});

describe('Shop strategy: sell-swap noise control', () => {
  const midKit = () =>
    ['POKER_FACE', 'RED_PILL', 'BLACK_ICE', 'PAVLOVS_BELL', 'FAKE_HESITATION'].map(jokerInst);

  it('suppresses swaps when the tier gap is under 25', () => {
    // ECHO_CHAMBER (80) vs weakest POKER_FACE (55): gap 25 — not enough.
    const decisions = evaluateShopDecisions(
      makeState({ phase: 'SHOP', jokers: midKit(), maxJokers: 5, money: 20 }),
      [jokerItem('ECHO_CHAMBER')],
    );
    expect(decisions.every((d) => d.type !== 'SELL_JOKER')).toBe(true);
  });

  it('still surfaces swaps for genuinely top-tier pickups', () => {
    const decisions = evaluateShopDecisions(
      makeState({ phase: 'SHOP', jokers: midKit(), maxJokers: 5, money: 20 }),
      [jokerItem('NEURAL_FEEDBACK')],
    );
    expect(decisions.some((d) => d.type === 'SELL_JOKER')).toBe(true);
  });
});

describe('Shop strategy: synergy and play stats', () => {
  it('penalizes jokers whose delay band conflicts with the current kit', () => {
    const conflict = evaluateShopDecisions(
      makeState({ phase: 'SHOP', jokers: [jokerInst('POKER_FACE')], money: 20 }),
      [jokerItem('FAKE_HESITATION')],
    );
    const baseline = evaluateShopDecisions(
      makeState({ phase: 'SHOP', jokers: [], money: 20 }),
      [jokerItem('FAKE_HESITATION')],
    );
    const conflictBuy = conflict.find((d) => d.type === 'BUY_ITEM');
    const baselineBuy = baseline.find((d) => d.type === 'BUY_ITEM');
    expect(conflictBuy).toBeDefined();
    expect(baselineBuy).toBeDefined();
    expect(conflictBuy!.confidence).toBeLessThan(baselineBuy!.confidence);
  });

  it('rewards jokers aligned with the current delay band', () => {
    const aligned = evaluateShopDecisions(
      makeState({ phase: 'SHOP', jokers: [jokerInst('FAKE_HESITATION')], money: 20 }),
      [jokerItem('PHANTOM_TELL')],
    );
    const baseline = evaluateShopDecisions(
      makeState({ phase: 'SHOP', jokers: [], money: 20 }),
      [jokerItem('PHANTOM_TELL')],
    );
    const alignedBuy = aligned.find((d) => d.type === 'BUY_ITEM');
    const baselineBuy = baseline.find((d) => d.type === 'BUY_ITEM');
    expect(alignedBuy!.confidence).toBeGreaterThan(baselineBuy!.confidence);
  });

  it('recommends upgrades for the hand type actually being played', () => {
    const flushUpgrade: ShopItem = {
      id: 'shop_up_flush',
      itemType: 'HAND_UPGRADE',
      name: 'Flush Scroll',
      nameZh: '同花卷轴',
      description: '',
      descriptionZh: '',
      cost: 4,
      icon: '📜',
      payload: { handTypeToUpgrade: 'FLUSH' },
    };
    const straightUpgrade: ShopItem = { ...flushUpgrade, id: 'shop_up_straight', payload: { handTypeToUpgrade: 'STRAIGHT' } };

    const decisions = evaluateShopDecisions(
      makeState({
        phase: 'SHOP',
        money: 20,
        consecutiveActions: ['FLUSH', 'FLUSH', 'STRAIGHT', 'FLUSH'],
      }),
      [straightUpgrade, flushUpgrade],
    );

    const flushDec = decisions.find((d) => d.item?.id === flushUpgrade.id);
    const straightDec = decisions.find((d) => d.item?.id === straightUpgrade.id);
    expect(flushDec).toBeDefined();
    expect(straightDec).toBeDefined();
    expect(flushDec!.confidence).toBeGreaterThan(straightDec!.confidence);
  });
});
