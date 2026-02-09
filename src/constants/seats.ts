/** Table seat positions and rotations for 4-player layout */

export type Seat = {
  position: [number, number, number];
  rotation: [number, number, number];
  cameraTarget: [number, number, number];
};

/**
 * Seat layout (top-down view):
 *
 *         Dong (north)
 *
 *  Meio              Oscar
 *  (west)            (east)
 *
 *       Visitor (south)
 */
export const SEATS: Record<string, Seat> = {
  south: { position: [0, 0, 1.7], rotation: [-Math.PI / 2, Math.PI, Math.PI], cameraTarget: [0, -0.5, 0] },
  west: { position: [-1.5, 0, 0], rotation: [-Math.PI / 2, Math.PI, -Math.PI / 2], cameraTarget: [-0.4, -0.5, 0] },
  north: { position: [0, 0, -1.5], rotation: [-Math.PI / 2, Math.PI, 0], cameraTarget: [0, -0.5, -0.4] },
  east: { position: [1.5, 0, 0], rotation: [-Math.PI / 2, Math.PI, Math.PI / 2], cameraTarget: [0.4, -0.5, 0] },
};

/** Ordered seat keys matching player order: [visitor, Meio, Dong, Oscar] */
export const SEAT_ORDER = ['south', 'west', 'north', 'east'] as const;

export const DRAW_PILE_POSITION: [number, number, number] = [-0.5, 0, 0];
export const DISCARD_PILE_POSITION: [number, number, number] = [0.5, 0, 0];
