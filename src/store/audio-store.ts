import { create } from 'zustand';

interface AudioState {
  isMuted: boolean;
  masterVolume: number;
  sfxVolume: number;
  bgmVolume: number;
  toggleMute: () => void;
  setMasterVolume: (vol: number) => void;
  setSfxVolume: (vol: number) => void;
  setBgmVolume: (vol: number) => void;
  initAudioStore: () => void;
}

const STORAGE_KEY = 'bluff_audio_settings';

interface SavedAudioSettings {
  isMuted?: boolean;
  masterVolume?: number;
  sfxVolume?: number;
  bgmVolume?: number;
}

function saveSettings(settings: SavedAudioSettings): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...settings }));
  } catch {}
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isMuted: false,
  masterVolume: 0.8,
  sfxVolume: 0.9,
  bgmVolume: 0.5,

  toggleMute: () => {
    const nextMuted = !get().isMuted;
    set({ isMuted: nextMuted });
    saveSettings({ isMuted: nextMuted });
  },

  setMasterVolume: (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    set({ masterVolume: clamped });
    saveSettings({ masterVolume: clamped });
  },

  setSfxVolume: (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    set({ sfxVolume: clamped });
    saveSettings({ sfxVolume: clamped });
  },

  setBgmVolume: (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    set({ bgmVolume: clamped });
    saveSettings({ bgmVolume: clamped });
  },

  initAudioStore: () => {
    if (typeof window === 'undefined') return;
    try {
      const savedRaw = localStorage.getItem(STORAGE_KEY);
      if (savedRaw) {
        const saved: SavedAudioSettings = JSON.parse(savedRaw);
        set({
          isMuted: typeof saved.isMuted === 'boolean' ? saved.isMuted : get().isMuted,
          masterVolume: typeof saved.masterVolume === 'number' ? saved.masterVolume : get().masterVolume,
          sfxVolume: typeof saved.sfxVolume === 'number' ? saved.sfxVolume : get().sfxVolume,
          bgmVolume: typeof saved.bgmVolume === 'number' ? saved.bgmVolume : get().bgmVolume,
        });
      }
    } catch {}
  },
}));
