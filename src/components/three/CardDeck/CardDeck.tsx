import { Value, Color } from 'uno-engine';
import { Card3D } from '@/components/three/Card3D';

type DeckCard = {
  value: Value;
  color?: Color;
};

const CARD_DEPTH = 0.003;

const COLORS = [Color.RED, Color.BLUE, Color.GREEN, Color.YELLOW];
const COLOR_VALUES = [
  Value.ZERO, Value.ONE, Value.TWO, Value.THREE, Value.FOUR,
  Value.FIVE, Value.SIX, Value.SEVEN, Value.EIGHT, Value.NINE,
  Value.DRAW_TWO, Value.REVERSE, Value.SKIP,
];

const DECK: DeckCard[] = [
  ...COLORS.flatMap((color) =>
    COLOR_VALUES.map((value) => ({ value, color })),
  ),
  { value: Value.WILD },
  { value: Value.WILD_DRAW_FOUR },
];

// Seeded pseudo-random for deterministic Z rotations
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
};

const CARD_ROTATIONS: [number, number, number][] = DECK.map((_, i) => [
  -Math.PI / 2,
  Math.PI,
  (seededRandom(i) - 0.5) * 0.06,
]);

type CardDeckProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
};

export const CardDeck = ({ position = [0, 0, 0], rotation = [0, 0, 0] }: CardDeckProps) => {
  return (
    <group position={position} rotation={rotation}>
      {DECK.map((card, i) => (
        <Card3D
          key={i}
          value={card.value}
          color={card.color}
          faceUp={false}
          position={[0, i * CARD_DEPTH, 0]}
          rotation={CARD_ROTATIONS[i]}
        />
      ))}
    </group>
  );
};
