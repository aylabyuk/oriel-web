import { CARD_WIDTH, CARD_HEIGHT } from '@/constants/cardGeometry';

export { CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH } from '@/constants/cardGeometry';

export const STACK_OFFSET = 0.005;
export const PULL_DISTANCE = 1.2;
export const CARD_SPREAD = 0.35;
export const FRONT_PULL = 0.6;
export const FLOAT_HEIGHT = 0.5;
export const PLAY_LIFT_HEIGHT = 1.2;
export const SCATTER_XZ = 0.06;
export const SCATTER_ROT = 0.15;
export const DECK_ROT_JITTER = 0.06;
export const CARD_HALF_HEIGHT = CARD_HEIGHT / 2;
export const OPPONENT_CARD_SPREAD = 0.15;
/** Extra perpendicular offset per side when neighbors give way. */
export const GAP_EXTRA_VISITOR = CARD_WIDTH / 2 + 0.1;
export const GAP_EXTRA_OPPONENT = CARD_WIDTH + 0.1;
/** Visitor camera tilt — tilts cards toward the camera (from develop branch) */
export const CAMERA_TILT_X = -0.65;
/** Small lift for visitor cards above surface */
export const CAMERA_LIFT_Y = 0.1;
