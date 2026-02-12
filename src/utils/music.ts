import { getCtx } from '@/utils/sounds';

/* ── Musical constants ─────────────────────────────────────────────── */

const BPM = 70;
const BEAT = 60 / BPM; // ~0.857s
const HALF = BEAT / 2;

// C minor pentatonic: C, Eb, F, G, Bb
const PAD_CHORDS: number[][] = [
  [262, 311, 392], // Cm  (C4, Eb4, G4)
  [349, 466, 523], // Fsus4 (F4, Bb4, C5)
  [311, 392, 466], // Eb  (Eb4, G4, Bb4)
  [262, 392, 523], // Cm/G (C4, G4, C5)
];

const ARP_PATTERNS: number[][] = [
  [523, 0, 622, 0, 523, 0, 466, 0], // C5 . Eb5 . C5 . Bb4 .
  [622, 0, 698, 0, 784, 0, 622, 0], // Eb5 . F5 . G5 . Eb5 .
  [784, 0, 622, 0, 523, 0, 0, 0], // G5 . Eb5 . C5 . . .
  [466, 0, 523, 0, 622, 0, 784, 0], // Bb4 . C5 . Eb5 . G5 .
];

const BASS_NOTES = [131, 131, 175, 196]; // C3, C3, F3, G3

/* ── Scheduling constants ──────────────────────────────────────────── */

const SCHEDULE_AHEAD = 0.1; // 100ms lookahead
const SCHEDULER_INTERVAL = 25; // 25ms tick

/* ── Module state ──────────────────────────────────────────────────── */

let masterGain: GainNode | null = null;
let lpFilter: BiquadFilterNode | null = null;
let noiseSource: AudioBufferSourceNode | null = null;
let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let playing = false;
let cachedNoiseBuf: AudioBuffer | null = null;
let pendingStateChangeListener: (() => void) | null = null;

// Layer cursors
let padCursor = 0;
let arpCursor = 0;
let arpPatternCursor = 0;
let bassCursor = 0;

// Next scheduled time per layer
let nextPadTime = 0;
let nextArpTime = 0;
let nextBassTime = 0;

/* ── Note schedulers ───────────────────────────────────────────────── */

const scheduleArp = (ac: AudioContext, time: number, freq: number): void => {
  const osc = ac.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = freq;

  const g = ac.createGain();
  g.gain.setValueAtTime(0.001, time);
  g.gain.linearRampToValueAtTime(0.04, time + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, time + HALF * 0.8);

  osc.connect(g);
  g.connect(lpFilter!);
  osc.start(time);
  osc.stop(time + HALF * 0.9);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
};

const scheduleBass = (ac: AudioContext, time: number, freq: number): void => {
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;

  const g = ac.createGain();
  g.gain.setValueAtTime(0.001, time);
  g.gain.linearRampToValueAtTime(0.04, time + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, time + BEAT * 3.8);

  osc.connect(g);
  g.connect(lpFilter!);
  osc.start(time);
  osc.stop(time + BEAT * 4);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
};

const schedulePad = (ac: AudioContext, time: number, chord: number[]): void => {
  const dur = BEAT * 8;
  for (const freq of chord) {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    // Subtle detuning for width (+/- 3 cents)
    osc.detune.value = (Math.random() - 0.5) * 6;
    osc.frequency.value = freq;

    const g = ac.createGain();
    g.gain.setValueAtTime(0.001, time);
    g.gain.linearRampToValueAtTime(0.03, time + 0.8);
    g.gain.setValueAtTime(0.03, time + dur - 1.0);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(g);
    g.connect(lpFilter!);
    osc.start(time);
    osc.stop(time + dur + 0.05);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }
};

/* ── Noise texture ─────────────────────────────────────────────────── */

const startNoiseTexture = (ac: AudioContext): void => {
  if (!cachedNoiseBuf) {
    const len = ac.sampleRate * 2;
    cachedNoiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const data = cachedNoiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  noiseSource = ac.createBufferSource();
  noiseSource.buffer = cachedNoiseBuf;
  noiseSource.loop = true;

  const noiseLp = ac.createBiquadFilter();
  noiseLp.type = 'lowpass';
  noiseLp.frequency.value = 800;

  const g = ac.createGain();
  g.gain.value = 0.015;

  noiseSource.connect(noiseLp);
  noiseLp.connect(g);
  g.connect(lpFilter!);
  noiseSource.start();
};

/* ── Scheduler ─────────────────────────────────────────────────────── */

const scheduler = (ac: AudioContext): void => {
  const horizon = ac.currentTime + SCHEDULE_AHEAD;

  // Pad layer — each chord lasts 8 beats (2 measures)
  while (nextPadTime < horizon) {
    schedulePad(ac, nextPadTime, PAD_CHORDS[padCursor % PAD_CHORDS.length]);
    padCursor++;
    nextPadTime += BEAT * 8;
  }

  // Arp layer — half-beat steps, 8 slots per pattern
  while (nextArpTime < horizon) {
    const pattern = ARP_PATTERNS[arpPatternCursor % ARP_PATTERNS.length];
    const freq = pattern[arpCursor];
    if (freq > 0) {
      scheduleArp(ac, nextArpTime, freq);
    }
    arpCursor++;
    if (arpCursor >= pattern.length) {
      arpCursor = 0;
      arpPatternCursor++;
    }
    nextArpTime += HALF;
  }

  // Bass layer — whole note (4 beats) per note
  while (nextBassTime < horizon) {
    scheduleBass(ac, nextBassTime, BASS_NOTES[bassCursor % BASS_NOTES.length]);
    bassCursor++;
    nextBassTime += BEAT * 4;
  }
};

/* ── Start / Stop ──────────────────────────────────────────────────── */

const beginScheduling = (ac: AudioContext): void => {
  const t = ac.currentTime + 0.05;
  padCursor = 0;
  arpCursor = 0;
  arpPatternCursor = 0;
  bassCursor = 0;
  nextPadTime = t;
  nextArpTime = t;
  nextBassTime = t;

  scheduler(ac);
  schedulerTimer = setInterval(() => scheduler(ac), SCHEDULER_INTERVAL);
};

export const startMusic = (): void => {
  if (playing) return;
  playing = true;

  const ac = getCtx();

  // Build audio graph: layers → lowpass → masterGain → destination
  lpFilter = ac.createBiquadFilter();
  lpFilter.type = 'lowpass';
  lpFilter.frequency.value = 2000;

  masterGain = ac.createGain();
  masterGain.gain.setValueAtTime(0.001, ac.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.5, ac.currentTime + 2);

  lpFilter.connect(masterGain);
  masterGain.connect(ac.destination);

  startNoiseTexture(ac);

  // If context is suspended (autoplay policy), defer scheduling
  if (ac.state === 'running') {
    beginScheduling(ac);
  } else {
    const onStateChange = () => {
      if (ac.state === 'running' && playing) {
        beginScheduling(ac);
      }
      ac.removeEventListener('statechange', onStateChange);
      pendingStateChangeListener = null;
    };
    pendingStateChangeListener = onStateChange;
    ac.addEventListener('statechange', onStateChange);
  }
};

export const stopMusic = (): void => {
  if (!playing) return;
  playing = false;

  // Stop scheduler immediately — no new notes
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }

  const ac = getCtx();

  // Remove pending statechange listener if context never resumed
  if (pendingStateChangeListener) {
    ac.removeEventListener('statechange', pendingStateChangeListener);
    pendingStateChangeListener = null;
  }

  // Fade out over 1.5s
  if (masterGain) {
    masterGain.gain.cancelScheduledValues(ac.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, ac.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.001, ac.currentTime + 1.5);
  }

  // Clean up after fade
  setTimeout(() => {
    if (playing) return; // restarted during fade
    if (noiseSource) {
      noiseSource.stop();
      noiseSource.disconnect();
      noiseSource = null;
    }
    if (lpFilter) {
      lpFilter.disconnect();
      lpFilter = null;
    }
    if (masterGain) {
      masterGain.disconnect();
      masterGain = null;
    }
  }, 1600);
};

export const setMusicEnabled = (v: boolean): void => {
  if (v) startMusic();
  else stopMusic();
};
