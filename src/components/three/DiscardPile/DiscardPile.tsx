import { animated, useSpring } from '@react-spring/three';
import { Card3D } from '@/components/three/Card3D';
import { DRAW_PILE_POSITION } from '@/constants';
import type { SerializedCard } from '@/types/game';

const LIFT_HEIGHT = 0.5;

type DiscardPileProps = {
  card: SerializedCard;
  position: [number, number, number];
  deckTopY: number;
  dealDelay: number;
};

export const DiscardPile = ({
  card,
  position,
  deckTopY,
  dealDelay,
}: DiscardPileProps) => {
  // Deck rotation: flat, face-down
  const deckRotX = -Math.PI / 2;
  const deckRotY = Math.PI;

  // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time mount animation
  const [spring] = useSpring(() => ({
    from: {
      posX: DRAW_PILE_POSITION[0],
      posY: deckTopY,
      posZ: DRAW_PILE_POSITION[2],
      rotX: deckRotX,
      rotY: deckRotY,
    },
    to: [
      // Phase 1: lift from deck
      { posY: deckTopY + LIFT_HEIGHT },
      // Phase 2: flip face-up in the air
      { rotY: 0 },
      // Phase 3: slide to discard x/z while staying in the air
      { posX: position[0], posZ: position[2] },
      // Phase 4: drop down to table surface
      { posY: position[1] },
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
      <Card3D
        value={card.value}
        color={card.color}
        faceUp
      />
    </animated.group>
  );
};
