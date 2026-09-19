/**
 * Audio Context Manager for Web Audio API
 * Handles browser autoplay policy and AudioContext lifecycle.
 */

let globalAudioCtx: AudioContext | null = null;
let isUnlocked = false;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!globalAudioCtx) {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (AudioCtxClass) {
      globalAudioCtx = new AudioCtxClass();
    }
  }

  return globalAudioCtx;
}

export function isAudioUnlocked(): boolean {
  return isUnlocked && globalAudioCtx !== null && globalAudioCtx.state === 'running';
}

export async function unlockAudio(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }

  if (ctx.state === 'running') {
    isUnlocked = true;
    return true;
  }

  return false;
}

/**
 * Automatically attaches one-time user interaction listeners to unlock AudioContext
 * on first click, tap, or key press.
 */
export function setupAutoplayUnlock(onUnlocked?: () => void): void {
  if (typeof window === 'undefined') return;

  const unlockHandler = () => {
    unlockAudio().then((success) => {
      if (success) {
        window.removeEventListener('pointerdown', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
        onUnlocked?.();
      }
    });
  };

  window.addEventListener('pointerdown', unlockHandler, { passive: true });
  window.addEventListener('keydown', unlockHandler, { passive: true });
  window.addEventListener('touchstart', unlockHandler, { passive: true });
}
