import { MagnetCard } from '@/components/three/MagnetCard';
import { getDeckPlacement } from '@/utils/zoneLayout';
import type { SerializedCard } from '@/types/game';

type MagnetDeckProps = {
  cards: SerializedCard[];
};

export const MagnetDeck = ({ cards }: MagnetDeckProps) => (
  <group>
    {cards.map((card, i) => {
      const placement = getDeckPlacement(i);
      return (
        <MagnetCard
          key={card.id}
          cardId={card.id}
          color={card.color}
          value={card.value}
          position={placement.position}
          yaw={placement.yaw}
          tilt={placement.tilt}
          roll={placement.roll}
          faceUp={placement.faceUp}
        />
      );
    })}
  </group>
);
