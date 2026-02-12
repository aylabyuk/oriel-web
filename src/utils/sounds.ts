let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let enabled = true;

export const getCtx = (): AudioContext => {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

const getNoiseBuffer = (): AudioBuffer => {
  if (!noiseBuffer) {
    const ac = getCtx();
    const len = ac.sampleRate * 0.2; // 200ms of noise — covers all sounds
    noiseBuffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
};

export const setSoundEnabled = (v: boolean): void => {
  enabled = v;
};

/** Disconnect all nodes in the chain when the source finishes playing. */
const autoDisconnect = (
  src: AudioScheduledSourceNode,
  ...chain: AudioNode[]
): void => {
  src.onended = () => {
    for (const n of chain) n.disconnect();
  };
};

/** Short filtered noise burst — sounds like a card flick. */
export const playTick = (): void => {
  if (!enabled) return;
  const ac = getCtx();
  const src = ac.createBufferSource();
  src.buffer = getNoiseBuffer();

  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 3000;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.15, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.03);

  src.connect(hp);
  hp.connect(gain);
  gain.connect(ac.destination);
  src.start();
  src.stop(ac.currentTime + 0.03);
  autoDisconnect(src, src, hp, gain);
};

/** Quick swoosh — noise with a downward bandpass sweep. */
export const playSwoosh = (): void => {
  if (!enabled) return;
  const ac = getCtx();
  const src = ac.createBufferSource();
  src.buffer = getNoiseBuffer();

  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 2;
  bp.frequency.setValueAtTime(4000, ac.currentTime);
  bp.frequency.exponentialRampToValueAtTime(800, ac.currentTime + 0.08);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.2, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);

  src.connect(bp);
  bp.connect(gain);
  gain.connect(ac.destination);
  src.start();
  src.stop(ac.currentTime + 0.08);
  autoDisconnect(src, src, bp, gain);
};

/** Rising shimmer — cards fanning open. Plays once at spread start. */
export const playFan = (): void => {
  if (!enabled) return;
  const ac = getCtx();
  const src = ac.createBufferSource();
  src.buffer = getNoiseBuffer();

  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.5;
  bp.frequency.setValueAtTime(800, ac.currentTime);
  bp.frequency.exponentialRampToValueAtTime(4000, ac.currentTime + 0.12);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.001, ac.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, ac.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);

  src.connect(bp);
  bp.connect(gain);
  gain.connect(ac.destination);
  src.start();
  src.stop(ac.currentTime + 0.15);
  autoDisconnect(src, src, bp, gain);
};

/** Soft slide — neighbors shifting apart or back together. */
export const playSlide = (): void => {
  if (!enabled) return;
  const ac = getCtx();
  const src = ac.createBufferSource();
  src.buffer = getNoiseBuffer();

  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.8;
  bp.frequency.value = 1500;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.001, ac.currentTime);
  gain.gain.linearRampToValueAtTime(0.08, ac.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.04);

  src.connect(bp);
  bp.connect(gain);
  gain.connect(ac.destination);
  src.start();
  src.stop(ac.currentTime + 0.04);
  autoDisconnect(src, src, bp, gain);
};

/** Low-frequency plop — card landing on the discard pile. */
export const playPlop = (): void => {
  if (!enabled) return;
  const ac = getCtx();
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(180, ac.currentTime + 0.06);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.2, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.1);
  autoDisconnect(osc, osc, gain);
};

/** Per-player two-tone chime — each AI gets a distinct pitch. */
const CHAT_TONES: Record<string, [number, number]> = {
  Meio: [523, 659], // C5 → E5 (major third) — composed
  Mark: [659, 831], // E5 → G#5 (major third) — punchy
  Paul: [784, 988], // G5 → B5 (major third) — mellow
};
const CHAT_DEFAULT: [number, number] = [880, 1175];

export const playChat = (personality?: string): void => {
  if (!enabled) return;
  const ac = getCtx();
  const [f1, f2] = (personality && CHAT_TONES[personality]) || CHAT_DEFAULT;

  // First tone
  const osc1 = ac.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = f1;
  const g1 = ac.createGain();
  g1.gain.setValueAtTime(0.1, ac.currentTime);
  g1.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
  osc1.connect(g1);
  g1.connect(ac.destination);
  osc1.start(ac.currentTime);
  osc1.stop(ac.currentTime + 0.12);
  autoDisconnect(osc1, osc1, g1);

  // Second tone — staggered for "ding-dong" feel
  const osc2 = ac.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = f2;
  const g2 = ac.createGain();
  g2.gain.setValueAtTime(0.001, ac.currentTime);
  g2.gain.linearRampToValueAtTime(0.08, ac.currentTime + 0.06);
  g2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
  osc2.connect(g2);
  g2.connect(ac.destination);
  osc2.start(ac.currentTime + 0.05);
  osc2.stop(ac.currentTime + 0.18);
  autoDisconnect(osc2, osc2, g2);
};

/** Bluff caught — sharp descending buzz. "Busted!" feel. */
export const playBluffCaught = (): void => {
  if (!enabled) return;
  const ac = getCtx();

  // Rapid descending tone — exposed!
  const osc = ac.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ac.currentTime + 0.15);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.12, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.2);
  autoDisconnect(osc, osc, gain);
};

/** Legit play — low ominous thud. Challenge failed. */
export const playLegitPlay = (): void => {
  if (!enabled) return;
  const ac = getCtx();

  // Deep thud — bad news
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.2);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.18, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.25);
  autoDisconnect(osc, osc, gain);
};

/** UNO penalty — short double-buzz. "Got you!" */
export const playUnoPenalty = (): void => {
  if (!enabled) return;
  const ac = getCtx();

  // Two quick buzz pulses
  for (let i = 0; i < 2; i++) {
    const t = ac.currentTime + i * 0.1;
    const osc = ac.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 320;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.07);
    autoDisconnect(osc, osc, gain);
  }
};

/** UNO shout — punchy rising burst. Urgent button-slam feel. */
export const playUnoShout = (): void => {
  if (!enabled) return;
  const ac = getCtx();

  // Sharp rising tone
  const osc = ac.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(250, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ac.currentTime + 0.08);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.14, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.12);
  autoDisconnect(osc, osc, gain);
};

/** Dramatic hit — WD4 challenge prompt. Suspenseful impact. */
export const playDramaticHit = (): void => {
  if (!enabled) return;
  const ac = getCtx();

  // Low impact tone
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ac.currentTime + 0.3);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.2, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.4);
  autoDisconnect(osc, osc, gain);

  // Noise burst — impact texture
  const src = ac.createBufferSource();
  src.buffer = getNoiseBuffer();
  const bp = ac.createBiquadFilter();
  bp.type = 'lowpass';
  bp.frequency.value = 600;
  const nGain = ac.createGain();
  nGain.gain.setValueAtTime(0.15, ac.currentTime);
  nGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
  src.connect(bp);
  bp.connect(nGain);
  nGain.connect(ac.destination);
  src.start();
  src.stop(ac.currentTime + 0.15);
  autoDisconnect(src, src, bp, nGain);
};

/** Victory fanfare — bright ascending major arpeggio. */
export const playVictory = (): void => {
  if (!enabled) return;
  const ac = getCtx();

  // C major arpeggio: C5 → E5 → G5 → C6, then final sustained chord
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  const noteGap = 0.1;
  const noteDur = 0.15;

  for (let i = 0; i < notes.length; i++) {
    const t = ac.currentTime + i * noteGap;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = notes[i];
    const g = ac.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + noteDur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t);
    osc.stop(t + noteDur);
    autoDisconnect(osc, osc, g);
  }

  // Final sustained major chord: C5 + E5 + G5 + C6 together
  const chordStart = ac.currentTime + notes.length * noteGap;
  for (const freq of notes) {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.08, chordStart);
    g.gain.exponentialRampToValueAtTime(0.001, chordStart + 0.5);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(chordStart);
    osc.stop(chordStart + 0.5);
    autoDisconnect(osc, osc, g);
  }
};

/** Defeat — descending minor arpeggio. Melancholy but gentle. */
export const playDefeat = (): void => {
  if (!enabled) return;
  const ac = getCtx();

  // C minor descending: C5 → Ab4 → Eb4 → C4
  const notes = [523, 415, 311, 262]; // C5, Ab4, Eb4, C4
  const noteGap = 0.15;
  const noteDur = 0.25;

  for (let i = 0; i < notes.length; i++) {
    const t = ac.currentTime + i * noteGap;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = notes[i];
    const g = ac.createGain();
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + noteDur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t);
    osc.stop(t + noteDur);
    autoDisconnect(osc, osc, g);
  }

  // Final low sustained note — lingering sadness
  const endT = ac.currentTime + notes.length * noteGap;
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 262; // C4
  const g = ac.createGain();
  g.gain.setValueAtTime(0.08, endT);
  g.gain.exponentialRampToValueAtTime(0.001, endT + 0.6);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(endT);
  osc.stop(endT + 0.6);
  autoDisconnect(osc, osc, g);
};

/** Gather — all cards rushing back to deck at once. Reverse swoosh + thud. */
export const playGather = (): void => {
  if (!enabled) return;
  const ac = getCtx();

  // Upward noise sweep — converging feel
  const src = ac.createBufferSource();
  src.buffer = getNoiseBuffer();
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.5;
  bp.frequency.setValueAtTime(600, ac.currentTime);
  bp.frequency.exponentialRampToValueAtTime(3500, ac.currentTime + 0.15);
  const nGain = ac.createGain();
  nGain.gain.setValueAtTime(0.12, ac.currentTime);
  nGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
  src.connect(bp);
  bp.connect(nGain);
  nGain.connect(ac.destination);
  src.start();
  src.stop(ac.currentTime + 0.18);
  autoDisconnect(src, src, bp, nGain);

  // Low thud at the end — cards stacking
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, ac.currentTime + 0.12);
  osc.frequency.exponentialRampToValueAtTime(120, ac.currentTime + 0.2);
  const tGain = ac.createGain();
  tGain.gain.setValueAtTime(0.001, ac.currentTime);
  tGain.gain.linearRampToValueAtTime(0.15, ac.currentTime + 0.12);
  tGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22);
  osc.connect(tGain);
  tGain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.22);
  autoDisconnect(osc, osc, tGain);
};
