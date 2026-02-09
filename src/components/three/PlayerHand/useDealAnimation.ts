import { useLayoutEffect, useMemo } from 'react';
import { useSprings } from '@react-spring/three';
import { DRAW_PILE_POSITION } from '@/constants';
import { seededRandom } from '@/utils/seededRandom';
import { CARD_DEPTH } from './constants';
import type { Seat } from '@/constants';
const DEAL_STAGGER_MS = 150;

type UseDealAnimationArgs = {
  count: number;
  seat: Seat;
  seatIndex: number;
  playerCount: number;
  surfaceY: number;
  deckTopY: number;
  dealBaseDelay: number;
};

export const useDealAnimation = ({
  count,
  seat,
  seatIndex,
  playerCount,
  surfaceY,
  deckTopY,
  dealBaseDelay,
}: UseDealAnimationArgs) => {
  const targets = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        jitterZ: (seededRandom(seatIndex * 100 + i) - 0.5) * 0.06,
        stackY: i * CARD_DEPTH,
        dealIndex: i * playerCount + seatIndex,
      })),
    [count, seatIndex, playerCount],
  );

  // Deck rotation: flat, face-down
  const deckRotX = -Math.PI / 2;
  const deckRotY = Math.PI;
  const deckRotZ = 0;

  // Only set `from` — no `to` so re-renders can never re-apply the deal chain
  const [springs, api] = useSprings(count, () => ({
    from: {
      posX: DRAW_PILE_POSITION[0],
      posY: deckTopY,
      posZ: DRAW_PILE_POSITION[2],
      rotX: deckRotX,
      rotY: deckRotY,
      rotZ: deckRotZ,
    },
    config: { tension: 170, friction: 20 },
  }), []);

  // Start the deal animation imperatively via useLayoutEffect so it fires
  // at the same time as react-spring's internal layout effect (before paint)
  useLayoutEffect(() => {
    api.start((i) => ({
      to: [
        // Phase 1: translate to seat x/z in the air
        {
          posX: seat.position[0],
          posZ: seat.position[2],
          rotX: seat.rotation[0],
          rotY: seat.rotation[1],
          rotZ: seat.rotation[2] + targets[i].jitterZ,
        },
        // Phase 2: drop down to seat surface
        { posY: surfaceY + targets[i].stackY },
      ],
      delay: dealBaseDelay + targets[i].dealIndex * DEAL_STAGGER_MS,
      config: { tension: 170, friction: 20 },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time mount animation
  }, []);

  return { springs, api };
};
