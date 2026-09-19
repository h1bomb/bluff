/**
 * Procedural SFX Synthesizer using Web Audio API
 * Generates immediate, zero-latency, zero-asset retro and tactile game sound effects.
 */

// Helper: generate white noise buffer
function createNoiseBuffer(ctx: AudioContext, durationSeconds: number): AudioBuffer {
  const bufferSize = Math.floor(ctx.sampleRate * durationSeconds);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export const sfxSynth = {
  /**
   * Card Select / Hover: Crisp, organic high-frequency click with subtle random detune
   */
  cardSelect(ctx: AudioContext, destination: AudioNode): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Randomize pitch slightly (±6%) to keep repeated selections natural
    const pitchJitter = 1 + (Math.random() * 0.12 - 0.06);
    const startFreq = 1200 * pitchJitter;
    const endFreq = 450 * pitchJitter;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.035);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.04);
  },

  /**
   * Card Play: Snappy felt snap + slide sound
   */
  cardPlay(ctx: AudioContext, destination: AudioNode): void {
    const now = ctx.currentTime;

    // 1. Noise burst (felt friction)
    const noiseBuffer = createNoiseBuffer(ctx, 0.08);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(1.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(destination);

    // 2. Thump body (table impact)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);

    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc.connect(oscGain);
    oscGain.connect(destination);

    noiseSource.start(now);
    osc.start(now);
    osc.stop(now + 0.08);
  },

  /**
   * Card Discard: Smooth air whoosh / card sliding away
   */
  cardDiscard(ctx: AudioContext, destination: AudioNode): void {
    const now = ctx.currentTime;
    const noiseBuffer = createNoiseBuffer(ctx, 0.1);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.1);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    noiseSource.start(now);
  },

  /**
   * Chip Clink: Dual high-frequency resonant chime of clay/ceramic chips
   */
  chipClink(ctx: AudioContext, destination: AudioNode): void {
    const now = ctx.currentTime;
    const jitter = 1 + (Math.random() * 0.1 - 0.05);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(2500 * jitter, now);
    osc2.frequency.setValueAtTime(3700 * jitter, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.06);
    osc2.stop(now + 0.06);
  },

  /**
   * Score Tick / Multiplier Step: Balatro-style escalating chime
   */
  scoreTick(ctx: AudioContext, destination: AudioNode, stepIndex: number = 0): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Semitone ladder ascending based on stepIndex
    const baseFreq = 440; // A4
    const clampedStep = Math.min(stepIndex, 24);
    const freq = baseFreq * Math.pow(1.059463, clampedStep); // 12-TET semitone

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.15);
  },

  /**
   * Model Break: Cyberpunk CRT Glitch & Cognitive Overload sound!
   * Heavy bass drop + static distortion burst + electronic breakdown
   */
  modelBreak(ctx: AudioContext, destination: AudioNode): void {
    const now = ctx.currentTime;

    // 1. Heavy distorted bass punch
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sawtooth';
    bass.frequency.setValueAtTime(160, now);
    bass.frequency.exponentialRampToValueAtTime(35, now + 0.4);

    bassGain.gain.setValueAtTime(0.7, now);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    bass.connect(bassGain);
    bassGain.connect(destination);
    bass.start(now);
    bass.stop(now + 0.45);

    // 2. High-speed glitch static
    const noiseBuffer = createNoiseBuffer(ctx, 0.3);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.linearRampToValueAtTime(800, now + 0.2);
    filter.Q.setValueAtTime(3.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(destination);
    noiseSource.start(now);

    // 3. Cyber laser zap
    const zap = ctx.createOscillator();
    const zapGain = ctx.createGain();
    zap.type = 'square';
    zap.frequency.setValueAtTime(1800, now + 0.05);
    zap.frequency.exponentialRampToValueAtTime(120, now + 0.25);

    zapGain.gain.setValueAtTime(0.25, now + 0.05);
    zapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    zap.connect(zapGain);
    zapGain.connect(destination);
    zap.start(now + 0.05);
    zap.stop(now + 0.26);
  },

  /**
   * Celebration / Win Chime: Ascending bright arcade arpeggio with celebratory chord
   */
  winChime(ctx: AudioContext, destination: AudioNode): void {
    const now = ctx.currentTime;
    // Rapid triumphant ascending arpeggio (C5 -> E5 -> G5 -> B5 -> C6 -> E6 -> G6)
    const arpeggio = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51, 1567.98];
    const noteDuration = 0.07;

    arpeggio.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * noteDuration;

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.32, startTime);
      gain.gain.exponentialRampToValueAtTime(0.005, startTime + 0.16);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(startTime);
      osc.stop(startTime + 0.18);
    });

    // Sustained triumphant victory harmony ring at the apex
    const chordTime = now + arpeggio.length * noteDuration * 0.85;
    const chordFreqs = [523.25, 783.99, 1046.5]; // C5, G5, C6
    chordFreqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, chordTime);

      gain.gain.setValueAtTime(0.28, chordTime);
      gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.55);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(chordTime);
      osc.stop(chordTime + 0.6);
    });
  },

  /**
   * Game Over / Defeat: Descending dark synth tones with heavy bass impact
   */
  gameOver(ctx: AudioContext, destination: AudioNode): void {
    const now = ctx.currentTime;
    // Descending melancholy minor progression (G4 -> F#4 -> F4 -> D4 -> Bb3 -> G2)
    const notes = [392.0, 369.99, 349.23, 293.66, 233.08, 98.0];
    const noteDuration = 0.15;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * noteDuration;

      osc.type = idx === notes.length - 1 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      if (idx === notes.length - 1) {
        // Slow sub-bass drop on final note
        osc.frequency.exponentialRampToValueAtTime(45, startTime + 0.6);
      }

      const noteVol = idx === notes.length - 1 ? 0.5 : 0.35;
      gain.gain.setValueAtTime(noteVol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.005, startTime + (idx === notes.length - 1 ? 0.65 : 0.28));

      osc.connect(gain);
      gain.connect(destination);

      osc.start(startTime);
      osc.stop(startTime + (idx === notes.length - 1 ? 0.7 : 0.3));
    });
  },

  /**
   * Modal / Popup Open: Snappy retro sci-fi UI popup chime
   */
  modalOpen(ctx: AudioContext, destination: AudioNode): void {
    const now = ctx.currentTime;

    // First rapid blip (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.04);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc1.connect(gain1);
    gain1.connect(destination);
    osc1.start(now);
    osc1.stop(now + 0.05);

    // Second bright confirmation chime (A5 -> E6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12);
    gain2.gain.setValueAtTime(0.28, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc2.connect(gain2);
    gain2.connect(destination);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.15);
  },

  /**
   * Stamp Slam / Impact: Heavy tactile stamp impact for "WRONG" label
   */
  stampHit(ctx: AudioContext, destination: AudioNode): void {
    const now = ctx.currentTime;

    // 1. Distortion sub punch
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.18);
    oscGain.gain.setValueAtTime(0.65, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(oscGain);
    oscGain.connect(destination);
    osc.start(now);
    osc.stop(now + 0.22);

    // 2. Mechanical impact thud
    const noiseBuffer = createNoiseBuffer(ctx, 0.07);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(2.0, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(destination);
    noiseSource.start(now);
  },

  /**
   * UI Click / Blip: Clean retro button confirmation
   */
  uiClick(ctx: AudioContext, destination: AudioNode): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.025);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.03);
  },
};
