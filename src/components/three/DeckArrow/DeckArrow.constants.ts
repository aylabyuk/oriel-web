import { TABLE_SURFACE_Y } from '@/components/three/Table';

/** Y position above the deck stack */
export const ARROW_BASE_Y = TABLE_SURFACE_Y + 0.55;

/** Bounce amplitude in world units */
export const ARROW_BOUNCE_AMPLITUDE = 0.06;

/** Bounce speed (radians per second) */
export const ARROW_BOUNCE_SPEED = 3;

/** Arrow color per theme — bright white/black for glow visibility */
export const ARROW_COLOR = { dark: '#ffffff', light: '#000000' } as const;

/** Emissive intensity for the glow effect */
export const ARROW_EMISSIVE_INTENSITY = 2;
