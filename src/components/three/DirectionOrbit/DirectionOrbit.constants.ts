export const ORBIT_RADIUS = 1.2;
export const ORBIT_Y = 0.056;
export const ORBIT_SPEED = 1.0; // rad/s — full revolution ~6.3s
/** HDR multiplier — pushes color above 1.0 so bloom catches it */
export const GLOW_INTENSITY = 2.0;

export const ARROW_LENGTH = 0.28;
export const ARROW_HALF_WIDTH = 0.16;
export const ARROW_HALF_HEIGHT = 0.025;

export const TAIL_ARC = 1.2; // radians of arc each tail covers (~69°)
export const TAIL_HALF_WIDTH = 0.04;
export const TAIL_HALF_HEIGHT = 0.018;

/** Tail sample count */
export const TAIL_SAMPLES = 16;
export const TAIL_STEP = TAIL_ARC / (TAIL_SAMPLES - 1);

/** Vertices per tail sample */
export const VERTS_PER_SAMPLE = 4;

export const ARROW_INDICES = [
  0, 1, 2, 3, 5, 4, 0, 3, 1, 1, 3, 4, 1, 4, 2, 2, 4, 5, 2, 5, 0, 0, 5, 3,
];
