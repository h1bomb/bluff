import { describe, it, expect, beforeEach } from 'vitest';
import { useAutopilotStore } from '../src/store/autopilot-store';
import { useLanguageStore } from '../src/store/language-store';
import { TRANSLATIONS } from '../src/lib/i18n/translations';

describe('Autopilot Store delegation controls', () => {
  beforeEach(() => {
    useAutopilotStore.setState({ isEnabled: false });
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  it('updates autopilot state and logs when setAutopilot is called', () => {
    const store = useAutopilotStore.getState();
    expect(store.isEnabled).toBe(false);

    store.setAutopilot(true);
    expect(useAutopilotStore.getState().isEnabled).toBe(true);
    const newestLog = useAutopilotStore.getState().thoughtLogs[0];
    expect(typeof newestLog).toBe('object');
    if (typeof newestLog === 'object') {
      expect(newestLog.zh).toContain('全自主认知接管');
      expect(newestLog.en).toContain('Full autonomous control active');
    }

    store.setAutopilot(false);
    expect(useAutopilotStore.getState().isEnabled).toBe(false);
    const afterDisableLog = useAutopilotStore.getState().thoughtLogs[0];
    expect(typeof afterDisableLog).toBe('object');
    if (typeof afterDisableLog === 'object') {
      expect(afterDisableLog.zh).toContain('切换至协同辅助模式');
      expect(afterDisableLog.en).toContain('Switched to co-pilot assist mode');
    }
  });

  it('toggles autopilot state correctly', () => {
    const store = useAutopilotStore.getState();
    expect(store.isEnabled).toBe(false);

    store.toggleAutopilot();
    expect(useAutopilotStore.getState().isEnabled).toBe(true);

    store.toggleAutopilot();
    expect(useAutopilotStore.getState().isEnabled).toBe(false);
  });
});

describe('Autopilot Confirm Modal Localization', () => {
  it('provides bilingual strings for prompt, title, and buttons', () => {
    const zh = TRANSLATIONS.zh.autopilot;
    const en = TRANSLATIONS.en.autopilot;

    expect(zh.confirmTitle).toBe('JEV 代打托管');
    expect(en.confirmTitle).toBe('JEV AUTOPILOT');

    expect(zh.confirmPrompt).toBe('是否开启 Jev 代打托管？');
    expect(en.confirmPrompt).toBe('Enable JEV Autopilot delegation?');

    expect(zh.enableOption).toContain('开启 Jev 托管');
    expect(en.enableOption).toContain('ENABLE JEV AUTOPILOT');

    expect(zh.manualOption).toContain('手动游玩');
    expect(en.manualOption).toContain('PLAY MANUALLY');

    expect(zh.cancel).toBe('取消');
    expect(en.cancel).toBe('CANCEL');
  });

  it('switches modal strings when language store language changes', () => {
    useLanguageStore.getState().setLanguage('zh');
    expect(useLanguageStore.getState().t.autopilot.confirmPrompt).toBe('是否开启 Jev 代打托管？');

    useLanguageStore.getState().setLanguage('en');
    expect(useLanguageStore.getState().t.autopilot.confirmPrompt).toBe('Enable JEV Autopilot delegation?');

    // Restore to zh
    useLanguageStore.getState().setLanguage('zh');
  });
});
