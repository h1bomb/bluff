/**
 * Procedural Cyberpunk Retro BGM Generator
 * Synthesizes a continuous, chill Lo-Fi / Synthwave ambient soundtrack
 * using Web Audio API nodes. Zero external assets required.
 */

export class BgmSynth {
  private ctx: AudioContext | null = null;
  private destination: AudioNode | null = null;
  private isPlaying = false;
  private timer: number | null = null;
  private currentStep = 0;
  private masterGain: GainNode | null = null;

  // Chord progression: Cm -> Ab -> Bb -> Gm
  private chords = [
    [130.81, 155.56, 196.0, 246.94], // C3, Eb3, G3, B3 (Cm9)
    [103.83, 130.81, 155.56, 207.65], // Ab2, C3, Eb3, Ab3 (Abmaj7)
    [116.54, 146.83, 174.61, 233.08], // Bb2, D3, F3, Bb3 (Bb)
    [98.0, 116.54, 146.83, 196.0],    // G2, Bb2, D3, G3 (Gm)
  ];

  // Arpeggio notes per chord in semitone intervals
  private arpPatterns = [
    [0, 3, 7, 10, 14, 10, 7, 3],
    [0, 4, 7, 11, 14, 11, 7, 4],
    [0, 2, 5, 9, 12, 9, 5, 2],
    [0, 3, 7, 10, 12, 10, 7, 3],
  ];

  public start(ctx: AudioContext, destination: AudioNode): void {
    if (this.isPlaying) return;
    this.ctx = ctx;
    this.destination = destination;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.35, ctx.currentTime);
    this.masterGain.connect(destination);

    this.isPlaying = true;
    this.currentStep = 0;

    // Start 16th note arpeggio sequence loop (~110 BPM -> 16th note ~136ms)
    const stepDurationMs = 140;
    this.timer = window.setInterval(() => {
      this.tick(stepDurationMs / 1000);
    }, stepDurationMs);
  }

  public stop(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    }
  }

  private tick(stepSeconds: number): void {
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;
    const now = this.ctx.currentTime;

    const chordIndex = Math.floor(this.currentStep / 16) % this.chords.length;
    const stepInChord = this.currentStep % 16;
    const currentChord = this.chords[chordIndex];
    const arpPattern = this.arpPatterns[chordIndex];

    // 1. Play bass pad on first beat of each chord
    if (stepInChord === 0) {
      this.playBassPad(currentChord[0], now, stepSeconds * 16);
    }

    // 2. Play gentle rhythmic arpeggio note (every 16th note)
    const baseFreq = currentChord[0] * 2; // one octave up
    const semitoneOffset = arpPattern[stepInChord % arpPattern.length];
    const arpFreq = baseFreq * Math.pow(1.059463, semitoneOffset);
    this.playArpNote(arpFreq, now, stepSeconds);

    // 3. Subtle cyberpunk hi-hat click on offbeats (2, 6, 10, 14)
    if (stepInChord % 4 === 2) {
      this.playHiHat(now);
    }

    this.currentStep = (this.currentStep + 1) % 64;
  }

  private playBassPad(freq: number, startTime: number, duration: number): void {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);

    // Warm analog lowpass filter sweep
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, startTime);
    filter.frequency.exponentialRampToValueAtTime(160, startTime + duration);

    // Smooth swelling envelope
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.18, startTime + 0.3);
    gain.gain.setValueAtTime(0.18, startTime + duration - 0.4);
    gain.gain.linearRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private playArpNote(freq: number, startTime: number, duration: number): void {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, startTime);
    filter.frequency.exponentialRampToValueAtTime(400, startTime + duration);

    gain.gain.setValueAtTime(0.07, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.9);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private playHiHat(startTime: number): void {
    if (!this.ctx || !this.masterGain) return;

    // Filtered noise click for subtle rhythm
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.03);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6000, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.035, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.03);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(startTime);
  }
}

export const bgmSynth = new BgmSynth();
