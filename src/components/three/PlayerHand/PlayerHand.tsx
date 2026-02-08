import { useMemo, useEffect } from 'react';
import { useSprings, animated } from '@react-spring/three';
import { Card3D } from '@/components/three/Card3D';
import { DRAW_PILE_POSITION } from '@/constants';
import type { SerializedCard } from '@/types/game';
import type { Seat } from '@/constants';

const CARD_DEPTH = 0.003;
const DEAL_STAGGER_MS = 150;
const PULL_DISTANCE = 1.0;
const STEP1_SETTLE_MS = 800;
const STEP2_SETTLE_MS = 800;
const CARD_HALF_HEIGHT = 0.5;
const CARD_SPREAD = 0.25;
const OPPONENT_CARD_SPREAD = 0.1;

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
  revealDelay?: number;
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
  revealDelay,
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
  const [springs, api] = useSprings(count, (i) => ({
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

  // REVEAL step 1: slide cards toward the player, still face-down and stacked
  const seatDist = Math.hypot(seat.position[0], seat.position[2]);
  const pullDirX = seat.position[0] / seatDist;
  const pullDirZ = seat.position[2] / seatDist;

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

  // REVEAL step 2: flip cards upright facing the player, still stacked
  const uprightRotY = useMemo(() => {
    let target = Math.atan2(seat.position[0], seat.position[2]);
    // Shortest-path normalization from current rotY (PI)
    while (target - Math.PI > Math.PI) target -= 2 * Math.PI;
    while (Math.PI - target > Math.PI) target += 2 * Math.PI;
    return target;
  }, [seat.position]);

  const pulledX = seat.position[0] + pullDirX * PULL_DISTANCE;
  const pulledZ = seat.position[2] + pullDirZ * PULL_DISTANCE;

  useEffect(() => {
    if (revealDelay == null) return;
    const timeout = setTimeout(() => {
      api.start((i) => ({
        to: {
          rotX: 0,
          rotY: uprightRotY,
          rotZ: 0,
          posY: surfaceY + CARD_HALF_HEIGHT,
          // Stack in depth: offset each card toward center so they don't z-fight
          posX: pulledX - pullDirX * i * CARD_DEPTH,
          posZ: pulledZ - pullDirZ * i * CARD_DEPTH,
        },
        config: { tension: 120, friction: 18 },
      }));
    }, revealDelay + STEP1_SETTLE_MS);
    return () => clearTimeout(timeout);
  }, [revealDelay, api, uprightRotY, surfaceY, pulledX, pulledZ, pullDirX, pullDirZ]);

  // REVEAL step 3: spread cards sideways so each card's value is visible
  const perpX = -pullDirZ;
  const perpZ = pullDirX;

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
  }, [revealDelay, api, count, pulledX, pulledZ, perpX, perpZ, pullDirX, pullDirZ]);

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
