let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let enabled = true;

const getCtx = (): AudioContext => {
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
};
