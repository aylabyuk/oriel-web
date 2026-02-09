import { MagnetCard } from '@/components/three/MagnetCard';
import { getPlayerFrontPlacement } from '@/utils/zoneLayout';
import type { SerializedCard } from '@/types/game';
import type { Seat } from '@/constants/seats';

type MagnetPlayerFrontProps = {
  cards: SerializedCard[];
  seat: Seat;
};

export const MagnetPlayerFront = ({ cards, seat }: MagnetPlayerFrontProps) => (
  <group>
    {cards.map((card, i) => {
      const placement = getPlayerFrontPlacement(i, seat);
      return (
        <MagnetCard
          key={card.id}
          cardId={card.id}
          color={card.color}
          value={card.value}
          position={placement.position}
          rotation={placement.rotation}
          faceUp={placement.faceUp}
        />
      );
    })}
  </group>
);
