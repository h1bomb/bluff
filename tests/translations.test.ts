import { describe, it, expect } from 'vitest';
import { TRANSLATIONS, enJson, zhJson, format } from '../src/lib/i18n/translations';
import { localizeBlindDisplay } from '../src/lib/history/snapshot';
import { useLanguageStore } from '../src/store/language-store';
import { JOKER_DEFINITIONS } from '../src/game/jokers/definitions';
import { BUFF_DEFINITIONS } from '../src/game/buffs/definitions';
import { BOSS_ROSTER } from '../src/game/engine/blinds';
import { evaluateHand } from '../src/game/poker/evaluator';
import { calculateHandScore } from '../src/game/scoring/calculator';

describe('i18n translations', () => {
  it('has defeatSub function in TRANSLATIONS for both en and zh', () => {
    expect(typeof TRANSLATIONS.zh.resultRoguelike.defeatSub).toBe('function');
    expect(typeof TRANSLATIONS.en.resultRoguelike.defeatSub).toBe('function');

    const defeatZh = TRANSLATIONS.zh.resultRoguelike.defeatSub(2, 'Boss');
    expect(defeatZh).toContain('ANTE 2 (Boss)');

    const defeatEn = TRANSLATIONS.en.resultRoguelike.defeatSub(3);
    expect(defeatEn).toContain('ANTE 3');
  });

  it('has defeatSub function in language-store t', () => {
    const { t } = useLanguageStore.getState();
    expect(typeof t.resultRoguelike.defeatSub).toBe('function');
  });

  it('initializes language store with default zh to avoid SSR hydration mismatches', () => {
    // Reset to default
    useLanguageStore.setState({ language: 'zh', t: TRANSLATIONS.zh });
    expect(useLanguageStore.getState().language).toBe('zh');
    expect(useLanguageStore.getState().t.game.initializing).toBe('正在初始化 AI 心理实验室...');
  });

  it('correctly toggles language and syncs state', () => {
    useLanguageStore.getState().setLanguage('zh');
    expect(useLanguageStore.getState().language).toBe('zh');

    useLanguageStore.getState().toggleLanguage();
    expect(useLanguageStore.getState().language).toBe('en');
    expect(useLanguageStore.getState().t.game.initializing).toBe('INITIALIZING AI LAB SESSION...');

    useLanguageStore.getState().toggleLanguage();
    expect(useLanguageStore.getState().language).toBe('zh');
  });

  it('has matching top-level keys between en.json and zh.json', () => {
    const enKeys = Object.keys(enJson).sort();
    const zhKeys = Object.keys(zhJson).sort();
    expect(enKeys).toEqual(zhKeys);
  });

  it('has full deep key parity between en.json and zh.json', () => {
    const collectLeafPaths = (obj: unknown, prefix = ''): string[] => {
      if (obj === null || typeof obj !== 'object') return [prefix];
      return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
        collectLeafPaths(v, prefix ? `${prefix}.${k}` : k)
      );
    };
    const enPaths = collectLeafPaths(enJson).sort();
    const zhPaths = collectLeafPaths(zhJson).sort();
    expect(zhPaths).toEqual(enPaths);
  });

  it('localizes blind display names for both languages incl. legacy strings', () => {
    expect(localizeBlindDisplay('首领盲注: 超频核心', 'en')).toBe(`Boss Blind: ${BOSS_ROSTER[3].name}`);
    expect(localizeBlindDisplay(`Boss Blind: ${BOSS_ROSTER[3].name}`, 'zh')).toBe('首领盲注: 超频核心');
    expect(localizeBlindDisplay('小盲注', 'en')).toBe(enJson.blinds.smallBlind);
    expect(localizeBlindDisplay('BIG', 'zh')).toBe(zhJson.blinds.bigBlind);
    expect(localizeBlindDisplay('Some Unknown Blind', 'zh')).toBe('Some Unknown Blind');
  });

  it('contains all required autopilot confirmation modal keys in both locales', () => {
    const requiredKeys = [
      'confirmTitle',
      'confirmPrompt',
      'confirmDesc',
      'enableOption',
      'manualOption',
      'starting',
      'cancel',
    ] as const;

    for (const key of requiredKeys) {
      expect(zhJson.autopilot[key]).toBeTruthy();
      expect(enJson.autopilot[key]).toBeTruthy();
      expect(TRANSLATIONS.zh.autopilot[key]).toBeTruthy();
      expect(TRANSLATIONS.en.autopilot[key]).toBeTruthy();
    }
  });

  it('correctly replaces placeholders with format helper', () => {
    const res = format('Hello {name}, you have {count} items.', { name: 'Alice', count: 5 });
    expect(res).toBe('Hello Alice, you have 5 items.');
  });

  it('sources all jokers, buffs, and boss blinds from JSON', () => {
    expect(Object.keys(JOKER_DEFINITIONS).length).toBe(18);
    for (const [, joker] of Object.entries(JOKER_DEFINITIONS)) {
      expect(joker.name).toBeTruthy();
      expect(joker.nameZh).toBeTruthy();
      expect(joker.description).toBeTruthy();
      expect(joker.descriptionZh).toBeTruthy();
    }

    expect(Object.keys(BUFF_DEFINITIONS).length).toBe(4);
    for (const [, buff] of Object.entries(BUFF_DEFINITIONS)) {
      expect(buff.tagline).toBeTruthy();
      expect(buff.description).toBeTruthy();
    }

    expect(BOSS_ROSTER.length).toBe(4);
    for (const boss of BOSS_ROSTER) {
      expect(boss.name).toBeTruthy();
      expect(boss.nameZh).toBeTruthy();
      expect(boss.bossAbility).toBeTruthy();
      expect(boss.bossAbilityZh).toBeTruthy();
    }
  });

  it('evaluates hands and calculates scores with localized descriptions', () => {
    const hand = evaluateHand([
      { id: '1', suit: '♠', rank: 14 },
      { id: '2', suit: '♠', rank: 13 },
      { id: '3', suit: '♠', rank: 12 },
      { id: '4', suit: '♠', rank: 11 },
      { id: '5', suit: '♠', rank: 10 },
    ]);
    expect(hand.description).toBe('Straight Flush (A High)');
    expect(hand.descriptionZh).toBe('同花顺 (A高)');

    const score = calculateHandScore({
      handCards: [
        { id: '1', suit: '♠', rank: 14 },
        { id: '2', suit: '♠', rank: 13 },
        { id: '3', suit: '♠', rank: 12 },
        { id: '4', suit: '♠', rank: 11 },
        { id: '5', suit: '♠', rank: 10 },
      ],
      actionDelayMs: 500, // fast tell
    });
    expect(score.tallySteps.length).toBeGreaterThan(2);
    const fastStep = score.tallySteps.find((s) => s.source === 'FAST_ACTION');
    expect(fastStep?.message).toBe(enJson.scoring.stepTemplates.fastTell);
    expect(fastStep?.messageZh).toBe(zhJson.scoring.stepTemplates.fastTell);
  });
});

