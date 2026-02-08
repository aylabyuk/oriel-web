import { useMemo } from 'react';
import { useSprings, animated } from '@react-spring/three';
import { Card3D } from '@/components/three/Card3D';
import { DRAW_PILE_POSITION } from '@/constants';
import type { SerializedCard } from '@/types/game';
import type { Seat } from '@/constants';

const CARD_DEPTH = 0.003;
const DEAL_STAGGER_MS = 150;

/** Seeded pseudo-random for deterministic pile jitter */
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
};

type PlayerHandProps = {
  cards: SerializedCard[];
  cardCount: number;
  seat: Seat;
  seatIndex: number;
  playerCount: number;
  faceUp: boolean;
  surfaceY: number;
  deckTopY: number;
  dealBaseDelay?: number;
};

export const PlayerHand = ({
  cards,
  cardCount,
  seat,
  seatIndex,
  playerCount,
  faceUp,
  surfaceY,
  deckTopY,
  dealBaseDelay = 0,
}: PlayerHandProps) => {
  const count = faceUp ? cards.length : cardCount;

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

  // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time mount animation
  const [springs] = useSprings(count, (i) => ({
    from: {
      posX: DRAW_PILE_POSITION[0],
      posY: deckTopY,
      posZ: DRAW_PILE_POSITION[2],
      rotX: deckRotX,
      rotY: deckRotY,
      rotZ: deckRotZ,
    },
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
  }), []);

  return (
    <group>
      {springs.map((spring, i) => {
        const card = faceUp ? cards[i] : undefined;
        return (
          <animated.group
            key={card?.id ?? i}
            position-x={spring.posX}
            position-y={spring.posY}
            position-z={spring.posZ}
            rotation-x={spring.rotX}
            rotation-y={spring.rotY}
            rotation-z={spring.rotZ}
          >
            <Card3D
              value={card?.value}
              color={card?.color}
              faceUp={faceUp}
            />
          </animated.group>
        );
      })}
    </group>
  );
};
