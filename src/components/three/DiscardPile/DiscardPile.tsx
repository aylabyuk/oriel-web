import { useMemo } from 'react';
import { Card3D } from '@/components/three/Card3D';
import type { SerializedCard } from '@/types/game';
import { seededRandom } from '@/utils/seededRandom';

export const STACK_OFFSET = 0.005;

type DiscardPileProps = {
  cards: SerializedCard[];
  position: [number, number, number];
};

export const DiscardPile = ({ cards, position }: DiscardPileProps) => {
  const cardPositions = useMemo(
    () =>
      cards.map((_, i) => ({
        position: [
          (seededRandom(i * 3) - 0.5) * 0.06,
          i * STACK_OFFSET,
          (seededRandom(i * 3 + 1) - 0.5) * 0.06,
        ] as [number, number, number],
        rotation: [
          -Math.PI / 2,
          0,
          (seededRandom(i * 3 + 2) - 0.5) * 0.15,
        ] as [number, number, number],
      })),
    [cards],
  );

  return (
    <group position={position}>
      {cards.map((card, i) => (
        <Card3D
          key={card.id}
          value={card.value}
          color={card.color}
          faceUp
          position={cardPositions[i].position}
          rotation={cardPositions[i].rotation}
        />
      ))}
    </group>
  );
};
