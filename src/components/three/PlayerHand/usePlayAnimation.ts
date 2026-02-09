import { useCallback, useRef } from 'react';
import type { SpringRef } from '@react-spring/three';
import { DISCARD_PILE_POSITION } from '@/constants';

const PLAY_LIFT_Y = 0.8;
const PLAY_CONFIG = { tension: 200, friction: 22 };
const LAY_CONFIG = { tension: 170, friction: 20 };

type SpringValues = {
  posX: number;
  posY: number;
  posZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
};

type UsePlayAnimationArgs = {
  api: SpringRef<SpringValues>;
  surfaceY: number;
};

export const usePlayAnimation = ({ api, surfaceY }: UsePlayAnimationArgs) => {
  const playingIndexRef = useRef<number | null>(null);

  const animatePlay = useCallback(
    async (cardIndex: number, onComplete: () => void) => {
      playingIndexRef.current = cardIndex;

      // Phase 1: Lift
      await Promise.all(
        api.start((i) => {
          if (i !== cardIndex) return {};
          return {
            to: { posY: surfaceY + PLAY_LIFT_Y },
            config: PLAY_CONFIG,
          };
        }),
      );

      // Phase 2: Move to discard pile, rotate face-up flat
      const randomRotZ = (Math.random() - 0.5) * 0.15;
      await Promise.all(
        api.start((i) => {
          if (i !== cardIndex) return {};
          return {
            to: {
              posX: DISCARD_PILE_POSITION[0],
              posZ: DISCARD_PILE_POSITION[2],
              rotX: -Math.PI / 2,
              rotY: 0,
              rotZ: randomRotZ,
            },
            config: PLAY_CONFIG,
          };
        }),
      );

      // Phase 3: Lay on discard pile
      await Promise.all(
        api.start((i) => {
          if (i !== cardIndex) return {};
          return {
            to: { posY: surfaceY },
            config: LAY_CONFIG,
          };
        }),
      );

      playingIndexRef.current = null;
      onComplete();
    },
    [api, surfaceY],
  );

  return { animatePlay, playingIndexRef };
};
