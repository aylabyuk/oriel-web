import { useCallback, useMemo, useRef, useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Value } from 'uno-engine';
import type { Color } from 'uno-engine';
import { Card3D } from '@/components/three/Card3D';
import { WildColorPicker } from '@/components/three/WildColorPicker';
import type { SerializedCard } from '@/types/game';
import type { Seat } from '@/constants';
import {
  CARD_DEPTH,
  PULL_DISTANCE,
  CARD_SPREAD,
  OPPONENT_CARD_SPREAD,
  CARD_HALF_HEIGHT,
  CAMERA_TILT_X,
  CAMERA_LIFT_Y,
} from './constants';

const GLOW_INTENSITY = 2.0;
const HOVER_LIFT = 0.15;
const PLAYABLE_LIFT = 0.08;

const isWild = (card: SerializedCard) =>
  card.value === Value.WILD || card.value === Value.WILD_DRAW_FOUR;

/**
 * Sort key: group by color, then numbers before specials, then wilds last.
 */
const getCardSortKey = (card: SerializedCard): number => {
  const value = card.value as number;
  const color = (card.color as number) ?? 99;
  if (value >= 13) return 10000 + value;
  const group = value <= 9 ? 0 : 1;
  const sortValue = value <= 9 ? 9 - value : value;
  return color * 1000 + group * 100 + sortValue;
};

type PlayerHandProps = {
  cards: SerializedCard[];
  seat: Seat;
  faceUp: boolean;
  isHuman?: boolean;
  surfaceY: number;
  isActive?: boolean;
  glowColor?: string;
  playableCardIds?: string[];
  onPlayCard?: (cardId: string, chosenColor?: Color) => void;
};

export const PlayerHand = ({
  cards,
  seat,
  faceUp,
  isHuman = false,
  surfaceY,
  isActive = false,
  glowColor,
  playableCardIds = [],
  onPlayCard,
}: PlayerHandProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sort cards for visual display
  const sortedCards = useMemo(() => {
    const indexed = cards.map((card, i) => ({ card, origIndex: i }));
    indexed.sort((a, b) => getCardSortKey(a.card) - getCardSortKey(b.card));
    return indexed;
  }, [cards]);

  // Compute seat-relative spread positions
  const seatDist = Math.hypot(seat.position[0], seat.position[2]);
  const pullDirX = seat.position[0] / seatDist;
  const pullDirZ = seat.position[2] / seatDist;
  const pulledX = seat.position[0] + pullDirX * PULL_DISTANCE;
  const pulledZ = seat.position[2] + pullDirZ * PULL_DISTANCE;
  const perpX = -pullDirZ;
  const perpZ = pullDirX;

  const spread = isHuman ? CARD_SPREAD : OPPONENT_CARD_SPREAD;
  const posY = surfaceY + CARD_HALF_HEIGHT + (isHuman ? CAMERA_LIFT_Y : 0);
  const rotX = isHuman ? CAMERA_TILT_X : 0;
  const rotY = Math.atan2(seat.position[0], seat.position[2]);
  const count = sortedCards.length;

  const slotPos = (slot: number) => {
    const offset = (slot - (count - 1) / 2) * spread;
    return {
      x: pulledX + perpX * offset - pullDirX * slot * CARD_DEPTH,
      z: pulledZ + perpZ * offset - pullDirZ * slot * CARD_DEPTH,
    };
  };

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

  const handleCardClick = useCallback((e: ThreeEvent<MouseEvent>, card: SerializedCard) => {
    e.stopPropagation();
    if (!playableCardIds.includes(card.id)) return;
    if (isWild(card)) return;
    document.body.style.cursor = '';
    setHoveredIndex(null);
    onPlayCard?.(card.id);
  }, [playableCardIds, onPlayCard]);

  const handleColorSelect = useCallback((cardId: string, color: Color) => {
    document.body.style.cursor = '';
    setHoveredIndex(null);
    onPlayCard?.(cardId, color);
  }, [onPlayCard]);

  return (
    <group onPointerMissed={handlePointerMissed}>
      {sortedCards.map(({ card }, i) => {
        const pos = slotPos(i);
        const playable = isActive && playableCardIds.includes(card.id);
        const hovered = hoveredIndex === i;
        const liftY = !playable ? 0 : hovered ? HOVER_LIFT : PLAYABLE_LIFT;
        return (
          <group
            key={card.id}
            position-x={pos.x}
            position-y={posY + liftY}
            position-z={pos.z}
            rotation-x={rotX}
            rotation-y={rotY}
            rotation-z={0}
          >
            <group
              onPointerOver={playable ? (e: ThreeEvent<PointerEvent>) => handlePointerOver(e, i) : undefined}
              onPointerOut={playable ? handlePointerOut : undefined}
              onPointerDown={playable ? (e: ThreeEvent<PointerEvent>) => handlePointerDown(e, i) : undefined}
              onClick={playable ? (e: ThreeEvent<MouseEvent>) => handleCardClick(e, card) : undefined}
            >
              <Card3D
                value={card.value}
                color={card.color}
                faceUp={faceUp}
                glowColor={glowColor}
                glowIntensity={playable ? GLOW_INTENSITY : 0}
              />
              {playable && isWild(card) && (
                <WildColorPicker
                  visible={hovered}
                  onColorSelect={(color: Color) => handleColorSelect(card.id, color)}
                />
              )}
            </group>
          </group>
        );
      })}
    </group>
  );
};
