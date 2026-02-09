import { useCallback, useEffect, useRef, useState } from 'react';
import { animated } from '@react-spring/three';
import type { ThreeEvent } from '@react-three/fiber';
import { Value } from 'uno-engine';
import { Card3D } from '@/components/three/Card3D';
import { WildColorPicker } from '@/components/three/WildColorPicker';
import { useDealAnimation } from './useDealAnimation';
import { useRevealAnimation, REVEAL_TOTAL_MS } from './useRevealAnimation';
import { useSortAnimation } from './useSortAnimation';
import { usePlayableLift } from './usePlayableLift';
import type { SerializedCard } from '@/types/game';
import type { Seat } from '@/constants';

const GLOW_INTENSITY = 2.0;

const isWild = (card: SerializedCard) =>
  card.value === Value.WILD || card.value === Value.WILD_DRAW_FOUR;

type PlayerHandProps = {
  cards: SerializedCard[];
  seat: Seat;
  seatIndex: number;
  playerCount: number;
  faceUp: boolean;
  surfaceY: number;
  deckTopY: number;
  dealBaseDelay?: number;
  revealDelay?: number;
  isActive?: boolean;
  glowColor?: string;
  playableCardIds?: string[];
  onReady?: () => void;
};

export const PlayerHand = ({
  cards,
  seat,
  seatIndex,
  playerCount,
  faceUp,
  surfaceY,
  deckTopY,
  dealBaseDelay = 0,
  revealDelay,
  isActive = false,
  glowColor,
  playableCardIds = [],
  onReady,
}: PlayerHandProps) => {
  const count = cards.length;

  const { springs, api } = useDealAnimation({
    count,
    seat,
    seatIndex,
    playerCount,
    surfaceY,
    deckTopY,
    dealBaseDelay,
  });

  useRevealAnimation({
    api,
    count,
    seat,
    faceUp,
    surfaceY,
    revealDelay,
  });

  const sortDelay =
    revealDelay != null ? revealDelay + REVEAL_TOTAL_MS : undefined;

  const { sorted } = useSortAnimation({
    api,
    cards,
    count,
    seat,
    faceUp,
    surfaceY,
    sortDelay,
  });

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>, i: number) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    setHoveredIndex(i);
  }, []);

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = '';
    hoverTimeout.current = setTimeout(() => {
      setHoveredIndex(null);
      hoverTimeout.current = null;
    }, 100);
  }, []);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>, i: number) => {
    if (e.nativeEvent.pointerType !== 'touch') return;
    e.stopPropagation();
    setHoveredIndex((prev) => (prev === i ? null : i));
  }, []);

  const handlePointerMissed = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const liftSprings = usePlayableLift({
    count,
    cards,
    playableCardIds,
    sorted,
    isActive,
    hoveredIndex,
  });

  useEffect(() => {
    if (sorted) onReady?.();
  }, [sorted, onReady]);

  const ready = sorted || sortDelay == null;

  return (
    <group onPointerMissed={handlePointerMissed}>
      {springs.map((spring, i) => {
        const card = cards[i];
        const playable = playableCardIds.includes(card.id);
        return (
          <animated.group
            key={card.id}
            position-x={spring.posX}
            position-y={spring.posY}
            position-z={spring.posZ}
            rotation-x={spring.rotX}
            rotation-y={spring.rotY}
            rotation-z={spring.rotZ}
          >
            <animated.group
              position-y={liftSprings[i].liftY}
              onPointerOver={playable ? (e: ThreeEvent<PointerEvent>) => handlePointerOver(e, i) : undefined}
              onPointerOut={playable ? handlePointerOut : undefined}
              onPointerDown={playable ? (e: ThreeEvent<PointerEvent>) => handlePointerDown(e, i) : undefined}
            >
              <Card3D
                value={card.value}
                color={card.color}
                faceUp={faceUp}
                glowColor={glowColor}
                glowIntensity={ready && isActive && playable ? GLOW_INTENSITY : 0}
              />
              {playable && isWild(card) && (
                <WildColorPicker visible={hoveredIndex === i} />
              )}
            </animated.group>
          </animated.group>
        );
      })}
    </group>
  );
};
