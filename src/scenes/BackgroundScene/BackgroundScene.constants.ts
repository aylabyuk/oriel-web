import { Value } from 'uno-engine';

/** Set to true to render the debug magnet card layer alongside visible cards. */
export const DEBUG_MAGNETS = false;

export const EFFECT_VALUES = new Set([
  Value.SKIP,
  Value.DRAW_TWO,
  Value.WILD_DRAW_FOUR,
]);

export const DIALOGUE_ALIGN: Record<string, 'left' | 'right'> = {
  Meio: 'right',
  Dong: 'left',
  Oscar: 'left',
};

/** Phases where gameplay UI (labels, direction orbit) should remain visible */
export const GAME_ACTIVE_PHASES = new Set([
  'playing',
  'play_gap',
  'play_lift',
  'play_move',
  'play_rotate',
  'draw_lift',
  'draw_move',
  'draw_gap',
  'draw_drop',
]);
