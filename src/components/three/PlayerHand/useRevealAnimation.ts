import { useMemo, useEffect } from 'react';
import type { SpringRef } from '@react-spring/three';
import type { Seat } from '@/constants';

const CARD_DEPTH = 0.003;
const PULL_DISTANCE = 1.2;
const STEP1_SETTLE_MS = 800;
const STEP2_SETTLE_MS = 800;
const CARD_HALF_HEIGHT = 0.5;
const STEP3_SETTLE_MS = 600;
const CARD_SPREAD = 0.25;
const OPPONENT_CARD_SPREAD = 0.1;
const STEP4_SETTLE_MS = 600;
const CAMERA_TILT_X = -0.35;
const CAMERA_LIFT_Y = 0.10;

/** Total time from revealDelay until all reveal steps have settled */
export const REVEAL_TOTAL_MS =
  STEP1_SETTLE_MS + STEP2_SETTLE_MS + STEP3_SETTLE_MS + STEP4_SETTLE_MS;

type UseRevealAnimationArgs = {
  api: SpringRef<{
    posX: number;
    posY: number;
    posZ: number;
    rotX: number;
    rotY: number;
    rotZ: number;
  }>;
  count: number;
  seat: Seat;
  faceUp: boolean;
  surfaceY: number;
  revealDelay: number | undefined;
};

export const useRevealAnimation = ({
  api,
  count,
  seat,
  faceUp,
  surfaceY,
  revealDelay,
}: UseRevealAnimationArgs) => {
  // Direction from center toward the seat
  const seatDist = Math.hypot(seat.position[0], seat.position[2]);
  const pullDirX = seat.position[0] / seatDist;
  const pullDirZ = seat.position[2] / seatDist;

  const pulledX = seat.position[0] + pullDirX * PULL_DISTANCE;
  const pulledZ = seat.position[2] + pullDirZ * PULL_DISTANCE;

  // Perpendicular direction for fanning cards
  const perpX = -pullDirZ;
  const perpZ = pullDirX;

  const uprightRotY = useMemo(() => {
    let target = Math.atan2(seat.position[0], seat.position[2]);
    // Shortest-path normalization from current rotY (PI)
    while (target - Math.PI > Math.PI) target -= 2 * Math.PI;
    while (Math.PI - target > Math.PI) target += 2 * Math.PI;
    return target;
  }, [seat.position]);

  // Step 1: slide cards toward the player, still face-down and stacked
  useEffect(() => {
    if (revealDelay == null) return;
    const timeout = setTimeout(() => {

      api.start(() => ({
        to: {
          posX: seat.position[0] + pullDirX * PULL_DISTANCE,
          posZ: seat.position[2] + pullDirZ * PULL_DISTANCE,
        },
        config: { tension: 120, friction: 18 },
      }));
    }, revealDelay);
    return () => clearTimeout(timeout);
  }, [revealDelay, api, seat.position, pullDirX, pullDirZ]);

  // Step 2: flip cards upright facing the player, still stacked
  useEffect(() => {
    if (revealDelay == null) return;
    const timeout = setTimeout(() => {

      api.start((i) => ({
        to: {
          rotX: 0,
          rotY: uprightRotY,
          rotZ: 0,
          posY: surfaceY + CARD_HALF_HEIGHT,
          posX: pulledX - pullDirX * i * CARD_DEPTH,
          posZ: pulledZ - pullDirZ * i * CARD_DEPTH,
        },
        config: { tension: 120, friction: 18 },
      }));
    }, revealDelay + STEP1_SETTLE_MS);
    return () => clearTimeout(timeout);
  }, [revealDelay, api, uprightRotY, surfaceY, pulledX, pulledZ, pullDirX, pullDirZ]);

  // Step 3: spread cards sideways so each card's value is visible
  useEffect(() => {
    if (revealDelay == null) return;
    const timeout = setTimeout(() => {

      api.start((i) => {
        const spread = faceUp ? CARD_SPREAD : OPPONENT_CARD_SPREAD;
        const offset = (i - (count - 1) / 2) * spread;
        return {
          to: {
            posX: pulledX + perpX * offset - pullDirX * i * CARD_DEPTH,
            posZ: pulledZ + perpZ * offset - pullDirZ * i * CARD_DEPTH,
          },
          config: { tension: 120, friction: 18 },
        };
      });
    }, revealDelay + STEP1_SETTLE_MS + STEP2_SETTLE_MS);
    return () => clearTimeout(timeout);
  }, [revealDelay, api, count, faceUp, pulledX, pulledZ, perpX, perpZ, pullDirX, pullDirZ]);

  // Step 4 (visitor only): lift cards slightly and tilt toward the camera
  useEffect(() => {
    if (revealDelay == null || !faceUp) return;
    const timeout = setTimeout(() => {

      api.start((i) => {
        const spread = CARD_SPREAD;
        const offset = (i - (count - 1) / 2) * spread;
        return {
          to: {
            rotX: CAMERA_TILT_X,
            posY: surfaceY + CARD_HALF_HEIGHT + CAMERA_LIFT_Y,
            posX: pulledX + perpX * offset - pullDirX * i * CARD_DEPTH,
            posZ: pulledZ + perpZ * offset - pullDirZ * i * CARD_DEPTH,
          },
          config: { tension: 100, friction: 22 },
        };
      });
    }, revealDelay + STEP1_SETTLE_MS + STEP2_SETTLE_MS + STEP3_SETTLE_MS);
    return () => clearTimeout(timeout);
  }, [revealDelay, api, count, faceUp, surfaceY, pulledX, pulledZ, perpX, perpZ, pullDirX, pullDirZ]);
};
