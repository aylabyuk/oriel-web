import { useMemo } from 'react';
import { animated, useSpring } from '@react-spring/three';
import { Card3D } from '@/components/three/Card3D';
import { DRAW_PILE_POSITION } from '@/constants';
import type { SerializedCard } from '@/types/game';
import { seededRandom } from '@/utils/seededRandom';

const CARD_DEPTH = 0.003;
const LIFT_HEIGHT = 0.5;

type DiscardPileProps = {
  cards: SerializedCard[];
  position: [number, number, number];
  deckTopY: number;
  dealDelay: number;
};

/** Animated first card — the initial flip from the draw pile. */
const InitialDiscard = ({
  card,
  position,
  deckTopY,
  dealDelay,
}: {
  card: SerializedCard;
  position: [number, number, number];
  deckTopY: number;
  dealDelay: number;
}) => {
  const deckRotX = -Math.PI / 2;
  const deckRotY = Math.PI;

  // Positions are relative to the parent <group position={position}>
  const fromX = DRAW_PILE_POSITION[0] - position[0];
  const fromZ = DRAW_PILE_POSITION[2] - position[2];
  const fromY = deckTopY - position[1];

  // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time mount animation
  const [spring] = useSpring(() => ({
    from: {
      posX: fromX,
      posY: fromY,
      posZ: fromZ,
      rotX: deckRotX,
      rotY: deckRotY,
    },
    to: [
      { posY: fromY + LIFT_HEIGHT },
      { rotY: 0 },
      { posX: 0, posZ: 0 },
      { posY: 0 },
    ],
    delay: dealDelay,
    config: { tension: 170, friction: 20 },
  }), []);

  return (
    <animated.group
      position-x={spring.posX}
      position-y={spring.posY}
      position-z={spring.posZ}
      rotation-x={spring.rotX}
      rotation-y={spring.rotY}
    >
      <Card3D value={card.value} color={card.color} faceUp />
    </animated.group>
  );
};

export const DiscardPile = ({
  cards,
  position,
  deckTopY,
  dealDelay,
}: DiscardPileProps) => {
  const restCards = cards.slice(1);

  const restPositions = useMemo(
    () =>
      restCards.map((_, i) => ({
        position: [
          (seededRandom(i * 3) - 0.5) * 0.06,
          (i + 1) * CARD_DEPTH,
          (seededRandom(i * 3 + 1) - 0.5) * 0.06,
        ] as [number, number, number],
        rotation: [
          -Math.PI / 2,
          0,
          (seededRandom(i * 3 + 2) - 0.5) * 0.15,
        ] as [number, number, number],
      })),
    [restCards.length],
  );

  return (
    <group position={position}>
      {cards.length > 0 && (
        <InitialDiscard
          key={cards[0].id}
          card={cards[0]}
          position={position}
          deckTopY={deckTopY}
          dealDelay={dealDelay}
        />
      )}
      {restCards.map((card, i) => (
        <Card3D
          key={card.id}
          value={card.value}
          color={card.color}
          faceUp
          position={restPositions[i].position}
          rotation={restPositions[i].rotation}
        />
      ))}
    </group>
  );
};
