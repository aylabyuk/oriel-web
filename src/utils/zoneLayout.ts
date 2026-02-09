import { seededRandom } from '@/utils/seededRandom';
import { DRAW_PILE_POSITION, DISCARD_PILE_POSITION } from '@/constants/seats';
import type { Seat } from '@/constants/seats';
import { TABLE_SURFACE_Y } from '@/components/three/Table/Table';

// --- Types ---

export type CardZone =
  | 'DECK'
  | 'DISCARD_PILE'
  | 'DISCARD_FLOAT'
  | 'PLAYER_FRONT'
  | 'PLAYER_HAND'
  | 'HAND_PREVIEW';

export type CardPlacement = {
  position: [number, number, number];
  rotation: [number, number, number];
  faceUp: boolean;
};

// --- Constants (from develop branch) ---

const CARD_DEPTH = 0.003;
const CARD_HEIGHT = 1.0;
const STACK_OFFSET = 0.005;
const PULL_DISTANCE = 1.2;
const CARD_SPREAD = 0.25;
const FRONT_PULL = 0.6;
const FLOAT_HEIGHT = 0.5;
const SCATTER_XZ = 0.06;
const SCATTER_ROT = 0.15;
const DECK_ROT_JITTER = 0.06;
const CARD_HALF_HEIGHT = CARD_HEIGHT / 2;
const OPPONENT_CARD_SPREAD = 0.1;
/** Visitor camera tilt — tilts cards toward the camera (from develop branch) */
const CAMERA_TILT_X = -0.65;
/** Small lift for visitor cards above surface */
const CAMERA_LIFT_Y = 0.1;

// --- Helpers ---

const seatAngle = (seat: Seat): number =>
  Math.atan2(seat.position[0], seat.position[2]);

const pullTowardCenter = (seat: Seat, pull: number) => {
  const dist = Math.hypot(seat.position[0], seat.position[2]);
  const dirX = seat.position[0] / dist;
  const dirZ = seat.position[2] / dist;
  return {
    x: seat.position[0] + dirX * pull,
    z: seat.position[2] + dirZ * pull,
    perpX: -dirZ,
    perpZ: dirX,
  };
};

// --- Zone placement functions ---

/** Deck: stacked face-down at draw pile position */
export const getDeckPlacement = (index: number): CardPlacement => ({
  position: [
    DRAW_PILE_POSITION[0],
    TABLE_SURFACE_Y + index * CARD_DEPTH,
    DRAW_PILE_POSITION[2],
  ],
  rotation: [
    -Math.PI / 2,
    Math.PI,
    (seededRandom(index) - 0.5) * DECK_ROT_JITTER,
  ],
  faceUp: false,
});

/** Discard pile: stacked face-up with seeded scatter */
export const getDiscardPilePlacement = (index: number): CardPlacement => ({
  position: [
    DISCARD_PILE_POSITION[0] + (seededRandom(index * 3) - 0.5) * SCATTER_XZ,
    TABLE_SURFACE_Y + index * STACK_OFFSET,
    DISCARD_PILE_POSITION[2] + (seededRandom(index * 3 + 1) - 0.5) * SCATTER_XZ,
  ],
  rotation: [
    -Math.PI / 2,
    0,
    (seededRandom(index * 3 + 2) - 0.5) * SCATTER_ROT,
  ],
  faceUp: true,
});

/** Discard float: elevated above discard pile, used during PLAY phase */
export const getDiscardFloatPlacement = (): CardPlacement => ({
  position: [
    DISCARD_PILE_POSITION[0],
    TABLE_SURFACE_Y + FLOAT_HEIGHT,
    DISCARD_PILE_POSITION[2],
  ],
  rotation: [-Math.PI / 2, 0, 0],
  faceUp: true,
});

/** Player front: stacked face-down in front of seat */
export const getPlayerFrontPlacement = (
  index: number,
  seat: Seat,
): CardPlacement => {
  const { x, z } = pullTowardCenter(seat, FRONT_PULL);
  const angle = seatAngle(seat);

  return {
    position: [x, TABLE_SURFACE_Y + index * CARD_DEPTH, z],
    rotation: [-Math.PI / 2, Math.PI, angle + Math.PI],
    faceUp: false,
  };
};

/** Player hand: standing face-up, facing each player's direction */
export const getPlayerHandPlacement = (
  index: number,
  totalCards: number,
  seat: Seat,
  isHuman = false,
): CardPlacement => {
  const { x, z, perpX, perpZ } = pullTowardCenter(seat, PULL_DISTANCE);
  const angle = seatAngle(seat);
  const spread = isHuman ? CARD_SPREAD : OPPONENT_CARD_SPREAD;
  const offset = (index - (totalCards - 1) / 2) * spread;

  // For upright cards, stack along the face normal (toward player) to avoid z-fighting.
  const depthIdx = totalCards - 1 - index;
  const normalX = Math.sin(angle);
  const normalZ = Math.cos(angle);

  return {
    position: [
      x + perpX * offset + (isHuman ? 0 : normalX * depthIdx * CARD_DEPTH),
      TABLE_SURFACE_Y + CARD_HALF_HEIGHT + (isHuman ? CAMERA_LIFT_Y + depthIdx * CARD_DEPTH : 0),
      z + perpZ * offset + (isHuman ? 0 : normalZ * depthIdx * CARD_DEPTH),
    ],
    rotation: [isHuman ? CAMERA_TILT_X : 0, angle, 0],
    faceUp: true,
  };
};

/** Hand preview: elevated above hand center, used during DRAW phase */
export const getHandPreviewPlacement = (seat: Seat): CardPlacement => {
  const { x, z } = pullTowardCenter(seat, PULL_DISTANCE);
  const angle = seatAngle(seat);

  return {
    position: [x, TABLE_SURFACE_Y + FLOAT_HEIGHT, z],
    rotation: [-Math.PI / 2, 0, angle],
    faceUp: true,
  };
};
