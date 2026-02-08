import { animated } from '@react-spring/three';
import { Card3D } from '@/components/three/Card3D';
import { useDealAnimation } from './useDealAnimation';
import { useRevealAnimation, REVEAL_TOTAL_MS } from './useRevealAnimation';
import { useSortAnimation } from './useSortAnimation';
import type { SerializedCard } from '@/types/game';
import type { Seat } from '@/constants';

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

  const { springs, api } = useDealAnimation({
    count,
    seat,
    seatIndex,
    playerCount,
    surfaceY,
    deckTopY,
    dealBaseDelay,
  });

  useRevealAnimation({
    api,
    count,
    seat,
    faceUp,
    surfaceY,
    revealDelay,
  });

  const sortDelay =
    revealDelay != null ? revealDelay + REVEAL_TOTAL_MS : undefined;

  useSortAnimation({
    api,
    cards,
    count,
    seat,
    faceUp,
    surfaceY,
    sortDelay,
  });

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
