import { useMemo } from 'react';
import { computeAllTargets, VISIBLE_DECK_LIMIT } from '@/utils/computeAllTargets';
import { VisibleCard } from '@/components/three/VisibleCard';
import { SEATS, SEAT_ORDER, DRAW_PILE_POSITION } from '@/constants';
import { TABLE_SURFACE_Y } from '@/components/three/Table/Table';
import type { MagnetState } from '@/hooks/useMagnetState';

type VisibleCardLayerProps = {
  magnet: MagnetState;
  forceImmediate?: boolean;
  playableCardIds?: string[];
  onCardClick?: (cardId: string) => void;
};

const seats = SEAT_ORDER.map((key) => SEATS[key]);

/** Card dimensions matching Card3D / zoneLayout */
const CARD_THICKNESS = 0.003;
const CARD_WIDTH = 0.7;
const CARD_HEIGHT = 1.0;

export const VisibleCardLayer = ({ magnet, forceImmediate, playableCardIds, onCardClick }: VisibleCardLayerProps) => {
  const targets = useMemo(
    () => computeAllTargets(magnet, seats, playableCardIds),
    [magnet, playableCardIds],
  );

  const hiddenDeckCards = Math.max(0, magnet.deck.length - VISIBLE_DECK_LIMIT);
  const deckBodyHeight = hiddenDeckCards * CARD_THICKNESS;

  return (
    <group position={[0, 0.01, 0]}>
      {deckBodyHeight > 0 && (
        <mesh
          position={[
            DRAW_PILE_POSITION[0],
            TABLE_SURFACE_Y + deckBodyHeight / 2,
            DRAW_PILE_POSITION[2],
          ]}
        >
          <boxGeometry args={[CARD_WIDTH, deckBodyHeight, CARD_HEIGHT]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
      )}
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
