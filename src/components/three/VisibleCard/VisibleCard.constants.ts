import type { SpringConfig } from '@/utils/computeAllTargets';

export const DEFAULT_CONFIG: SpringConfig = { tension: 300, friction: 35 };
/** Gentle spring for playable lift / glow so transitions feel smooth */
export const PLAYABLE_CONFIG: SpringConfig = { tension: 80, friction: 14 };

export const PLAYABLE_LIFT = 0.12;
export const PLAYABLE_GLOW_COLOR = '#ffffff';
export const PLAYABLE_GLOW = 0.6;

/** Keyboard-selected card: stronger lift + glow to stand out from playable */
export const SELECTED_LIFT = 0.22;
export const SELECTED_GLOW = 1.2;

/** Deck bob: gentle sine-wave hover */
export const DECK_BOB_AMPLITUDE = 0.025;
export const DECK_BOB_SPEED = 3;
/** Deck glow: pulsing emissive */
export const DECK_GLOW_MIN = 0.15;
export const DECK_GLOW_RANGE = 1;
export const DECK_GLOW_SPEED = 2.5;
