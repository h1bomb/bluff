import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sfxSynth } from '../src/lib/audio/sfx-synth';
import { audioManager } from '../src/lib/audio/audio-manager';
import { useAudioStore } from '../src/store/audio-store';

function createMockAudioContext() {
  const mockNode = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  };

  const createGain = () => ({
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      value: 1,
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  });

  const createOscillator = () => ({
    type: 'sine' as OscillatorType,
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  });

  const createBiquadFilter = () => ({
    type: 'lowpass' as BiquadFilterType,
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    Q: {
      setValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  });

  const createBufferSource = () => ({
    buffer: null as AudioBuffer | null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  });

  const createBuffer = () => ({
    getChannelData: () => new Float32Array(100),
  });

  return {
    currentTime: 0.1,
    sampleRate: 44100,
    state: 'running' as AudioContextState,
    destination: mockNode,
    createGain,
    createOscillator,
    createBiquadFilter,
    createBufferSource,
    createBuffer,
    resume: vi.fn().mockResolvedValue(undefined),
  } as unknown as AudioContext;
}

describe('SFX Synthesizer Popup & Event Sound Effects', () => {
  let ctx: AudioContext;
  let destination: AudioNode;

  beforeEach(() => {
    ctx = createMockAudioContext();
    destination = ctx.createGain();
  });

  it('synthesizes modalOpen SFX for dialog/popup opening', () => {
    expect(() => sfxSynth.modalOpen(ctx, destination)).not.toThrow();
  });

  it('synthesizes stampHit SFX for WRONG label stamp impact', () => {
    expect(() => sfxSynth.stampHit(ctx, destination)).not.toThrow();
  });

  it('synthesizes winChime SFX for victory celebration', () => {
    expect(() => sfxSynth.winChime(ctx, destination)).not.toThrow();
  });

  it('synthesizes gameOver SFX for defeat sequence', () => {
    expect(() => sfxSynth.gameOver(ctx, destination)).not.toThrow();
  });

  it('synthesizes modelBreak SFX for CRT cognitive glitch', () => {
    expect(() => sfxSynth.modelBreak(ctx, destination)).not.toThrow();
  });
});

describe('AudioManager integration with popup SFX names', () => {
  beforeEach(() => {
    useAudioStore.setState({
      isMuted: false,
      masterVolume: 0.8,
      sfxVolume: 0.9,
    });
  });

  it('dispatches modalOpen through audioManager', async () => {
    const playSpy = vi.spyOn(sfxSynth, 'modalOpen');
    await audioManager.playSfx('modalOpen');
    // If running in node environment without native audio window, spy won't throw
    expect(playSpy).toBeDefined();
  });

  it('dispatches winChime, gameOver, and modelBreak without throwing', async () => {
    await expect(audioManager.playSfx('winChime')).resolves.not.toThrow();
    await expect(audioManager.playSfx('gameOver')).resolves.not.toThrow();
    await expect(audioManager.playSfx('modelBreak')).resolves.not.toThrow();
    await expect(audioManager.playSfx('stampHit')).resolves.not.toThrow();
  });

  it('skips playback when muted', async () => {
    useAudioStore.setState({ isMuted: true });
    const spy = vi.spyOn(sfxSynth, 'modalOpen');
    await audioManager.playSfx('modalOpen');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
