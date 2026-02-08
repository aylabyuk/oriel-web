import { useMemo } from 'react';
import { Card3D } from '@/components/three/Card3D';

const CARD_DEPTH = 0.003;

/** Seeded pseudo-random for deterministic Z rotations */
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
};

const getRotation = (i: number): [number, number, number] => [
  -Math.PI / 2,
  Math.PI,
  (seededRandom(i) - 0.5) * 0.06,
];

type CardDeckProps = {
  count: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
};

export const CardDeck = ({ count, position = [0, 0, 0], rotation = [0, 0, 0] }: CardDeckProps) => {
  const cards = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        position: [0, i * CARD_DEPTH, 0] as [number, number, number],
        rotation: getRotation(i),
      })),
    [count],
  );

  return (
    <group position={position} rotation={rotation}>
      {cards.map((card, i) => (
        <Card3D
          key={i}
          faceUp={false}
          position={card.position}
          rotation={card.rotation}
        />
      ))}
    </group>
  );
};
