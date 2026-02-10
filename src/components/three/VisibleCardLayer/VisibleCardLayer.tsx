import { useMemo } from 'react';
import { computeAllTargets } from '@/utils/computeAllTargets';
import { VisibleCard } from '@/components/three/VisibleCard';
import { SEATS, SEAT_ORDER } from '@/constants';
import type { MagnetState } from '@/hooks/useMagnetState';

type VisibleCardLayerProps = {
  magnet: MagnetState;
  forceImmediate?: boolean;
  playableCardIds?: string[];
  onCardClick?: (cardId: string) => void;
};

const seats = SEAT_ORDER.map((key) => SEATS[key]);

export const VisibleCardLayer = ({ magnet, forceImmediate, playableCardIds, onCardClick }: VisibleCardLayerProps) => {
  const targets = useMemo(
    () => computeAllTargets(magnet, seats, playableCardIds),
    [magnet, playableCardIds],
  );

  return (
    <group position={[0, 0.01, 0]}>
      {targets.map((t) => (
        <VisibleCard
          key={t.cardId}
          cardId={t.cardId}
          value={t.value}
          color={t.color}
          to={t.placement}
          immediate={forceImmediate || t.immediate}
          springConfig={t.springConfig}
          playable={t.playable}
          onCardClick={onCardClick}
        />
      ))}
    </group>
  );
};
