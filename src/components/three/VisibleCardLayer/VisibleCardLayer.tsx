import { useMemo } from 'react';
import { computeAllTargets } from '@/utils/computeAllTargets';
import { VisibleCard } from '@/components/three/VisibleCard';
import { SEATS, SEAT_ORDER } from '@/constants';
import type { MagnetState } from '@/hooks/useMagnetState';

type VisibleCardLayerProps = {
  magnet: MagnetState;
};

const seats = SEAT_ORDER.map((key) => SEATS[key]);

export const VisibleCardLayer = ({ magnet }: VisibleCardLayerProps) => {
  const targets = useMemo(
    () => computeAllTargets(magnet, seats),
    [magnet],
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
          immediate={t.immediate}
        />
      ))}
    </group>
  );
};
