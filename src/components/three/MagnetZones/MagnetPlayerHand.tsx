import { MagnetCard } from '@/components/three/MagnetCard';
import { getPlayerHandPlacement } from '@/utils/zoneLayout';
import type { SerializedCard } from '@/types/game';
import type { Seat } from '@/constants/seats';

type MagnetPlayerHandProps = {
  cards: SerializedCard[];
  seat: Seat;
};

export const MagnetPlayerHand = ({ cards, seat }: MagnetPlayerHandProps) => (
  <group>
    {cards.map((card, i) => {
      const placement = getPlayerHandPlacement(i, cards.length, seat);
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
