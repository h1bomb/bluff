import { getAudioContext, unlockAudio } from './audio-context';
import { sfxSynth } from './sfx-synth';
import { bgmSynth } from './bgm-synth';
import { useAudioStore } from '@/store/audio-store';

export type SfxName =
  | 'cardSelect'
  | 'cardPlay'
  | 'cardDiscard'
  | 'chipClink'
  | 'scoreTick'
  | 'modelBreak'
  | 'winChime'
  | 'gameOver'
  | 'modalOpen'
  | 'stampHit'
  | 'uiClick';

interface PlaySfxOptions {
  stepIndex?: number;
  customFile?: string;
}

class AudioManager {
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private currentBgmAudio: HTMLAudioElement | null = null;
  private currentBgmTrack: string | null = null;
  private isBgmSynthPlaying = false;
  private bgmFadeTimer: number | null = null;
  private audioBufferCache: Map<string, AudioBuffer> = new Map();
  private isInitialized = false;

  private initGraph(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    const ctx = getAudioContext();
    if (!ctx) return;

    this.masterGain = ctx.createGain();
    this.sfxGain = ctx.createGain();
    this.bgmGain = ctx.createGain();

    this.sfxGain.connect(this.masterGain);
    this.bgmGain.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);

    this.syncGains();

    // Subscribe to store changes to update gains live
    useAudioStore.subscribe(() => {
      this.syncGains();
      this.syncBgmVolume();
    });

    this.isInitialized = true;
  }

  private syncGains(): void {
    const { isMuted, masterVolume, sfxVolume, bgmVolume } = useAudioStore.getState();
    const effectiveMaster = isMuted ? 0 : masterVolume;
    const ctx = getAudioContext();
    const now = ctx ? ctx.currentTime : 0;

    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(effectiveMaster, now);
    }
    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(sfxVolume, now);
    }
    if (this.bgmGain) {
      const effectiveBgm = isMuted ? 0 : bgmVolume;
      this.bgmGain.gain.setValueAtTime(effectiveBgm, now);
    }

    // Auto-resume or pause synthetic BGM if active
    if (this.isBgmSynthPlaying && (isMuted || bgmVolume <= 0)) {
      bgmSynth.stop();
      this.isBgmSynthPlaying = false;
    } else if (!this.isBgmSynthPlaying && !isMuted && bgmVolume > 0 && !this.currentBgmAudio) {
      if (ctx && ctx.state === 'running' && this.bgmGain) {
        bgmSynth.start(ctx, this.bgmGain);
        this.isBgmSynthPlaying = true;
      }
    }
  }

  private syncBgmVolume(): void {
    if (!this.currentBgmAudio) return;
    const { isMuted, masterVolume, bgmVolume } = useAudioStore.getState();
    const targetVolume = isMuted ? 0 : masterVolume * bgmVolume;
    this.currentBgmAudio.volume = Math.max(0, Math.min(1, targetVolume));
  }

  /**
   * Plays a sound effect immediately.
   * If a custom audio file path is cached or available, it plays it;
   * otherwise it falls back to the zero-latency procedural synthesizer.
   */
  public async playSfx(name: SfxName, options?: PlaySfxOptions): Promise<void> {
    if (typeof window === 'undefined') return;
    const { isMuted, sfxVolume, masterVolume } = useAudioStore.getState();
    if (isMuted || sfxVolume <= 0 || masterVolume <= 0) return;

    // Ensure audio context is ready
    await unlockAudio();
    this.initGraph();

    const ctx = getAudioContext();
    if (!ctx || !this.sfxGain) return;

    // Check if an external audio file is provided and cached
    if (options?.customFile && this.audioBufferCache.has(options.customFile)) {
      const buffer = this.audioBufferCache.get(options.customFile)!;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.sfxGain);
      source.start();
      return;
    }

    // Default to procedural synthesizer
    switch (name) {
      case 'cardSelect':
        sfxSynth.cardSelect(ctx, this.sfxGain);
        break;
      case 'cardPlay':
        sfxSynth.cardPlay(ctx, this.sfxGain);
        break;
      case 'cardDiscard':
        sfxSynth.cardDiscard(ctx, this.sfxGain);
        break;
      case 'chipClink':
        sfxSynth.chipClink(ctx, this.sfxGain);
        break;
      case 'scoreTick':
        sfxSynth.scoreTick(ctx, this.sfxGain, options?.stepIndex ?? 0);
        break;
      case 'modelBreak':
        sfxSynth.modelBreak(ctx, this.sfxGain);
        break;
      case 'winChime':
        sfxSynth.winChime(ctx, this.sfxGain);
        break;
      case 'gameOver':
        sfxSynth.gameOver(ctx, this.sfxGain);
        break;
      case 'modalOpen':
        sfxSynth.modalOpen(ctx, this.sfxGain);
        break;
      case 'stampHit':
        sfxSynth.stampHit(ctx, this.sfxGain);
        break;
      case 'uiClick':
        sfxSynth.uiClick(ctx, this.sfxGain);
        break;
    }
  }

  /**
   * Preload an audio file for zero-latency playback
   */
  public async preloadAudio(url: string): Promise<boolean> {
    if (typeof window === 'undefined' || this.audioBufferCache.has(url)) return true;
    const ctx = getAudioContext();
    if (!ctx) return false;

    try {
      const response = await fetch(url);
      if (!response.ok) return false;
      const arrayBuffer = await response.arrayBuffer();
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.audioBufferCache.set(url, decodedBuffer);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Start or resume background music.
   * If trackUrl is provided, it attempts to load and play that file.
   * Otherwise, starts the procedural cyberpunk Lo-Fi synthesizer!
   */
  public async startBgm(trackUrl?: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const { isMuted, bgmVolume } = useAudioStore.getState();
    if (isMuted || bgmVolume <= 0) return;

    await unlockAudio();
    this.initGraph();

    if (trackUrl) {
      this.playBgm(trackUrl);
      return;
    }

    // Default to zero-latency procedural cyberpunk synthwave ambient track
    const ctx = getAudioContext();
    if (ctx && this.bgmGain && !this.isBgmSynthPlaying && !this.currentBgmAudio) {
      bgmSynth.start(ctx, this.bgmGain);
      this.isBgmSynthPlaying = true;
    }
  }

  /**
   * Play background music with crossfade / fade-in
   */
  public playBgm(trackUrl: string, loop: boolean = true): void {
    if (typeof window === 'undefined') return;
    if (this.isBgmSynthPlaying) {
      bgmSynth.stop();
      this.isBgmSynthPlaying = false;
    }
    if (this.currentBgmTrack === trackUrl && this.currentBgmAudio && !this.currentBgmAudio.paused) {
      return;
    }

    if (this.bgmFadeTimer) {
      clearInterval(this.bgmFadeTimer);
      this.bgmFadeTimer = null;
    }

    const { isMuted, masterVolume, bgmVolume } = useAudioStore.getState();
    const finalVolume = isMuted ? 0 : masterVolume * bgmVolume;

    // Fade out existing BGM if playing
    if (this.currentBgmAudio) {
      const oldAudio = this.currentBgmAudio;
      let fadeVol = oldAudio.volume;
      const fadeOutStep = () => {
        fadeVol = Math.max(0, fadeVol - 0.1);
        oldAudio.volume = fadeVol;
        if (fadeVol <= 0.05) {
          oldAudio.pause();
          oldAudio.src = '';
        } else {
          setTimeout(fadeOutStep, 40);
        }
      };
      fadeOutStep();
    }

    const audio = new Audio(trackUrl);
    audio.loop = loop;
    audio.volume = 0;
    this.currentBgmAudio = audio;
    this.currentBgmTrack = trackUrl;

    const playPromise = audio.play();
    if (playPromise) {
      playPromise
        .then(() => {
          // Smooth fade in
          let currentVol = 0;
          const targetVol = finalVolume;
          const stepSize = Math.max(0.02, targetVol / 15);
          const fadeInInterval = window.setInterval(() => {
            currentVol = Math.min(targetVol, currentVol + stepSize);
            if (this.currentBgmAudio === audio) {
              audio.volume = currentVol;
            }
            if (currentVol >= targetVol) {
              clearInterval(fadeInInterval);
            }
          }, 40);
        })
        .catch(() => {
          // Playback might be prevented before user interaction
        });
    }
  }

  /**
   * Stop background music with smooth fade-out
   */
  public stopBgm(fadeDurationMs: number = 400): void {
    if (this.isBgmSynthPlaying) {
      bgmSynth.stop();
      this.isBgmSynthPlaying = false;
    }
    if (!this.currentBgmAudio) return;
    const audio = this.currentBgmAudio;
    this.currentBgmTrack = null;

    let vol = audio.volume;
    const stepInterval = 40;
    const steps = Math.max(1, Math.floor(fadeDurationMs / stepInterval));
    const stepDelta = vol / steps;

    const fadeTimer = window.setInterval(() => {
      vol = Math.max(0, vol - stepDelta);
      audio.volume = vol;
      if (vol <= 0.01) {
        clearInterval(fadeTimer);
        audio.pause();
        audio.src = '';
        if (this.currentBgmAudio === audio) {
          this.currentBgmAudio = null;
        }
      }
    }, stepInterval);
  }
}

export const audioManager = new AudioManager();
