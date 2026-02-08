import { useEffect, useMemo } from 'react';
import type { SpringRef } from '@react-spring/three';
import type { SerializedCard } from '@/types/game';
import type { Seat } from '@/constants';

const CARD_DEPTH = 0.003;
const PULL_DISTANCE = 1.2;
const CARD_SPREAD = 0.25;
const CARD_WIDTH = 0.7;
const CARD_HALF_HEIGHT = 0.5;
const CAMERA_TILT_X = -0.35;
const CAMERA_LIFT_Y = 0.1;
const SORT_LIFT_Y = CARD_HALF_HEIGHT;
const GAP_HALF = CARD_WIDTH; // each side shifts a full card width from the gap center

// Critically-damped springs — no overshoot, snappy
const CARD_CONFIG = { mass: 0.2, tension: 900, friction: 28 };
const NEIGHBOUR_CONFIG = { mass: 0.15, tension: 1200, friction: 28 };

type SpringValues = {
  posX: number;
  posY: number;
  posZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
};

type UseSortAnimationArgs = {
  api: SpringRef<SpringValues>;
  cards: SerializedCard[];
  count: number;
  seat: Seat;
  surfaceY: number;
  sortDelay: number | undefined;
};

/**
 * Sort key: group by color first, then numerical order within color,
 * then special cards (skip, reverse, draw_two) by color,
 * then wilds last.
 *
 * Color enum: RED=1, BLUE=2, GREEN=3, YELLOW=4
 * Value enum: 0-9 numbers, 10=DRAW_TWO, 11=REVERSE, 12=SKIP, 13=WILD, 14=WILD_DRAW_FOUR
 */
const getCardSortKey = (card: SerializedCard): number => {
  const value = card.value as number;
  const color = (card.color as number) ?? 99;

  // Wilds (no color) go last
  if (value >= 13) return 10000 + value;
  // Colored cards: group by color, then number cards (descending) before specials
  const group = value <= 9 ? 0 : 1; // 0 = number, 1 = special
  const sortValue = value <= 9 ? 9 - value : value; // reverse numbers: 9,8,7...0
  return color * 1000 + group * 100 + sortValue;
};

export const useSortAnimation = ({
  api,
  cards,
  count,
  seat,
  surfaceY,
  sortDelay,
}: UseSortAnimationArgs) => {
  const seatDist = Math.hypot(seat.position[0], seat.position[2]);
  const pullDirX = seat.position[0] / seatDist;
  const pullDirZ = seat.position[2] / seatDist;
  const pulledX = seat.position[0] + pullDirX * PULL_DISTANCE;
  const pulledZ = seat.position[2] + pullDirZ * PULL_DISTANCE;
  const perpX = -pullDirZ;
  const perpZ = pullDirX;

  const settledY = surfaceY + CARD_HALF_HEIGHT + CAMERA_LIFT_Y;
  const liftedY = settledY + SORT_LIFT_Y;

  // sortOrder[slot] = original card index that belongs at that slot
  const sortOrder = useMemo(() => {
    if (cards.length === 0) return [];
    const indices = cards.map((_, i) => i);
    indices.sort((a, b) => getCardSortKey(cards[a]) - getCardSortKey(cards[b]));
    return indices;
  }, [cards]);

  useEffect(() => {
    if (sortDelay == null || count <= 1) return;
    let cancelled = false;

    // Normal spread position for a slot
    const slotPos = (slot: number) => {
      const offset = (slot - (count - 1) / 2) * CARD_SPREAD;
      return {
        posX: pulledX + perpX * offset - pullDirX * slot * CARD_DEPTH,
        posZ: pulledZ + perpZ * offset - pullDirZ * slot * CARD_DEPTH,
      };
    };

    // Spread position with a symmetric gap at gapSlot
    const gappedPos = (slot: number, gapSlot: number) => {
      const base = slotPos(slot);
      if (slot < gapSlot) {
        return {
          posX: base.posX - perpX * GAP_HALF,
          posZ: base.posZ - perpZ * GAP_HALF,
        };
      }
      if (slot > gapSlot) {
        return {
          posX: base.posX + perpX * GAP_HALF,
          posZ: base.posZ + perpZ * GAP_HALF,
        };
      }
      return base;
    };

    const timeout = setTimeout(async () => {
      const currentSlot = Array.from({ length: count }, (_, i) => i);

      for (let targetSlot = 0; targetSlot < count; targetSlot++) {
        if (cancelled) return;

        const origIdx = sortOrder[targetSlot];
        const fromSlot = currentSlot[origIdx];

        if (fromSlot === targetSlot) continue;

        // 1+2. Open gap at source + lift the card simultaneously
        await Promise.all(
          api.start((i) => {
            if (i === origIdx) {
              return {
                to: { posY: liftedY, rotX: 0 },
                config: CARD_CONFIG,
              };
            }
            const pos = gappedPos(currentSlot[i], fromSlot);
            return {
              to: { posX: pos.posX, posZ: pos.posZ },
              config: NEIGHBOUR_CONFIG,
            };
          }),
        );
        if (cancelled) return;

        // 3+4. Move card to target + open target gap simultaneously
        const targetPos = slotPos(targetSlot);
        for (let s = fromSlot; s > targetSlot; s--) {
          const cardAtPrev = currentSlot.findIndex((slot) => slot === s - 1);
          if (cardAtPrev !== -1) currentSlot[cardAtPrev] = s;
        }
        currentSlot[origIdx] = targetSlot;

        await Promise.all(
          api.start((i) => {
            if (i === origIdx) {
              return {
                to: { posX: targetPos.posX, posZ: targetPos.posZ },
                config: CARD_CONFIG,
              };
            }
            const pos = gappedPos(currentSlot[i], targetSlot);
            return {
              to: { posX: pos.posX, posZ: pos.posZ },
              config: NEIGHBOUR_CONFIG,
            };
          }),
        );
        if (cancelled) return;

        // 5. Settle card down into the open gap
        await Promise.all(
          api.start((i) => {
            if (i !== origIdx) return {};
            return {
              to: {
                posY: settledY,
                rotX: CAMERA_TILT_X,
                posX: targetPos.posX,
                posZ: targetPos.posZ,
              },
              config: CARD_CONFIG,
            };
          }),
        );
        if (cancelled) return;

        // 6. Close gap — all cards to normal spread
        await Promise.all(
          api.start((i) => {
            const slot = currentSlot[i];
            const finalPos = slotPos(slot);
            return {
              to: { posX: finalPos.posX, posZ: finalPos.posZ },
              config: NEIGHBOUR_CONFIG,
            };
          }),
        );
      }
    }, sortDelay);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [sortDelay, api, count, sortOrder, liftedY, settledY, pulledX, pulledZ, perpX, perpZ, pullDirX, pullDirZ]);
};
