/**
 * Mulberry32 — fast, high-quality 32-bit seeded PRNG.
 * Returns a function that produces a new [0, 1) value on each call,
 * identical sequence for the same seed.
 *
 * Usage:
 *   const rng = mulberry32(42);
 *   rng(); // 0.6011037519201636
 *   rng(); // 0.4424838498327881
 */
export const mulberry32 = (seed: number) => {
  let t = (seed | 0) + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
