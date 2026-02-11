import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { computeAllTargets } from '@/utils/computeAllTargets';
import { VisibleCard } from '@/components/three/VisibleCard';
import { SEATS, SEAT_ORDER } from '@/constants';
import type { MagnetState } from '@/hooks/useMagnetState';

type VisibleCardLayerProps = {
  magnet: MagnetState;
  forceImmediate?: boolean;
  playableCardIds?: string[];
  onCardClick?: (cardId: string) => void;
  onDeckClick?: () => void;
  onDeckReady?: () => void;
};

const seats = SEAT_ORDER.map((key) => SEATS[key]);

/** Number of deck cards to mount per frame during progressive rendering */
const DECK_BATCH_SIZE = 15;

export const VisibleCardLayer = ({
  magnet,
  forceImmediate,
  playableCardIds,
  onCardClick,
  onDeckClick,
  onDeckReady,
}: VisibleCardLayerProps) => {
  const [deckLimit, setDeckLimit] = useState(0);
  const deckReadyFiredRef = useRef(false);

  // Progressively increase how many deck cards are rendered, one batch per frame
  useEffect(() => {
    if (deckLimit >= magnet.deck.length) return;
    const id = requestAnimationFrame(() => {
      setDeckLimit((prev) =>
        Math.min(prev + DECK_BATCH_SIZE, magnet.deck.length),
      );
    });
    return () => cancelAnimationFrame(id);
  }, [deckLimit, magnet.deck.length]);

  // Signal when all deck cards are mounted
  useEffect(() => {
    if (
      magnet.deck.length > 0 &&
      deckLimit >= magnet.deck.length &&
      !deckReadyFiredRef.current
    ) {
      deckReadyFiredRef.current = true;
      onDeckReady?.();
    }
  }, [deckLimit, magnet.deck.length, onDeckReady]);

  const deckClickEnabled = !!onDeckClick;
  const handleDeckClick = useCallback(
    (_cardId: string) => onDeckClick?.(),
    [onDeckClick],
  );
  const targets = useMemo(
    () =>
      computeAllTargets(
        magnet,
        seats,
        playableCardIds,
        deckLimit,
        deckClickEnabled,
      ),
    [magnet, playableCardIds, deckLimit, deckClickEnabled],
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
          deckClickable={t.deckClickable}
          onCardClick={t.deckClickable ? handleDeckClick : onCardClick}
        />
      ))}
    </group>
  );
};
