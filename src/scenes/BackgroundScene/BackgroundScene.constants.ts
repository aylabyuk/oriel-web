import { Value } from 'uno-engine';
import {
  AI_STRATEGIST,
  AI_TRASH_TALKER,
  AI_CHILL,
} from '@/constants/players';

export const DEFAULT_CAMERA_POSITION = [0, 2.28, 3.19] as const;
export const DEFAULT_CAMERA_TARGET = [0, -0.3, 0] as const;
export const DEFAULT_CAMERA_FOV = 80;

/** Set to true to render the debug magnet card layer alongside visible cards. */
export const DEBUG_MAGNETS = false;

export const EFFECT_VALUES = new Set([
  Value.SKIP,
  Value.DRAW_TWO,
  Value.WILD_DRAW_FOUR,
]);

export const DIALOGUE_ALIGN: Record<string, 'left' | 'right'> = {
  [AI_STRATEGIST]: 'right',
  [AI_TRASH_TALKER]: 'left',
  [AI_CHILL]: 'left',
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
