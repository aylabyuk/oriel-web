import { MagnetCard } from '@/components/three/MagnetCard';
import { getDiscardPilePlacement } from '@/utils/zoneLayout';
import type { SerializedCard } from '@/types/game';

type MagnetDiscardPileProps = {
  cards: SerializedCard[];
};

export const MagnetDiscardPile = ({ cards }: MagnetDiscardPileProps) => (
  <group>
    {cards.map((card, i) => {
      const placement = getDiscardPilePlacement(i);
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
