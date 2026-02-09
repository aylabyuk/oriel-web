import { useEffect, useRef } from 'react';
import { useSprings } from '@react-spring/three';
import type { SerializedCard } from '@/types/game';

/** Lift along the card's local Y axis — the parent group's rotX
 *  automatically decomposes this into correct world Y + Z. */
const PLAYABLE_LIFT = 0.15;
const HOVER_LIFT = 0.35;
const LIFT_CONFIG = { mass: 0.2, tension: 600, friction: 24 };

type UsePlayableLiftArgs = {
  count: number;
  cards: SerializedCard[];
  playableCardIds: string[];
  sorted: boolean;
  isActive: boolean;
  hoveredIndex: number | null;
};

export const usePlayableLift = ({
  count,
  cards,
  playableCardIds,
  sorted,
  isActive,
  hoveredIndex,
}: UsePlayableLiftArgs) => {
  const cardsRef = useRef(cards);
  cardsRef.current = cards;

  const playableKey = playableCardIds.join(',');

  const [springs, api] = useSprings(count, () => ({
    from: { liftY: 0 },
    config: LIFT_CONFIG,
  }), []);

  useEffect(() => {
    if (!sorted) return;

    const playableSet = new Set(playableKey.split(',').filter(Boolean));

    api.start((i) => {
      const isPlayable = isActive && playableSet.has(cardsRef.current[i]?.id);
      const lift = !isPlayable ? 0 : i === hoveredIndex ? HOVER_LIFT : PLAYABLE_LIFT;
      return { to: { liftY: lift }, config: LIFT_CONFIG };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cardsRef is stable; playableKey is a content-based key
  }, [api, playableKey, sorted, isActive, hoveredIndex]);

  return springs;
};
