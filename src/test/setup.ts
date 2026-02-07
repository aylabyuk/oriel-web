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

afterEach(() => {
  cleanup();
});
