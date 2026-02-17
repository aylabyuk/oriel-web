import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock leva — @stitches/react uses CSSOM APIs unsupported in JSDOM
vi.mock('leva', () => ({
  useControls: (_name: string, schema: Record<string, unknown>) => {
    const defaults: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(schema)) {
      defaults[key] =
        val && typeof val === 'object' && 'value' in val
          ? (val as { value: unknown }).value
          : val;
    }
    return defaults;
  },
}));

// R3F Canvas requires ResizeObserver which JSDOM doesn't provide
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// JSDOM doesn't provide AudioContext (used by sounds/music utilities)
const noop = () => {};
const mockAudioParam = { value: 0, setValueAtTime: noop, linearRampToValueAtTime: noop, exponentialRampToValueAtTime: noop, cancelScheduledValues: noop };
const mockNode = () => ({ connect: noop, disconnect: noop, start: noop, stop: noop, onended: null });
global.AudioContext = class AudioContext {
  state = 'suspended' as AudioContextState;
  sampleRate = 44100;
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  resume() { return Promise.resolve(); }
  addEventListener() {}
  removeEventListener() {}
  createBuffer(_channels: number, length: number, sampleRate: number) {
    return { getChannelData: () => new Float32Array(length), length, sampleRate } as unknown as AudioBuffer;
  }
  createBufferSource() { return { ...mockNode(), buffer: null } as unknown as AudioBufferSourceNode; }
  createGain() { return { ...mockNode(), gain: { ...mockAudioParam } } as unknown as GainNode; }
  createBiquadFilter() { return { ...mockNode(), type: 'lowpass', frequency: { ...mockAudioParam }, Q: { ...mockAudioParam } } as unknown as BiquadFilterNode; }
  createOscillator() { return { ...mockNode(), type: 'sine', frequency: { ...mockAudioParam } } as unknown as OscillatorNode; }
} as unknown as typeof AudioContext;

afterEach(() => {
  cleanup();
});
