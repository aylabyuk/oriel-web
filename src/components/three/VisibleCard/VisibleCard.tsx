import { Suspense, useRef } from 'react';
import { useSpring } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh, MeshStandardMaterial } from 'three';
import { Card3D } from '@/components/three/Card3D';
import type { Value, Color } from 'uno-engine';
import type { CardPlacement } from '@/utils/zoneLayout';
import type { SpringConfig } from '@/utils/computeAllTargets';

const DEFAULT_CONFIG: SpringConfig = { tension: 300, friction: 35 };
/** Gentle spring for playable lift / glow so transitions feel smooth */
const PLAYABLE_CONFIG: SpringConfig = { tension: 80, friction: 14 };

const PLAYABLE_LIFT = 0.12;
const PLAYABLE_GLOW_COLOR = '#ffffff';
const PLAYABLE_GLOW = 0.6;

/** Deck bob: gentle sine-wave hover */
const DECK_BOB_AMPLITUDE = 0.025;
const DECK_BOB_SPEED = 3;
/** Deck glow: pulsing emissive */
const DECK_GLOW_MIN = 0.15;
const DECK_GLOW_RANGE = 1;
const DECK_GLOW_SPEED = 2.5;

type VisibleCardProps = {
  cardId: string;
  value: Value;
  color: Color | undefined;
  to: CardPlacement;
  immediate?: boolean;
  springConfig?: SpringConfig;
  playable?: boolean;
  deckClickable?: boolean;
  onCardClick?: (cardId: string) => void;
};

/**
 * Normalize an angle difference so the spring takes the shortest rotation path.
 * Returns a target value within PI of the current spring value.
 */
const shortestYaw = (target: number, current: number): number => {
  const diff = target - current;
  return current + (diff - Math.round(diff / (2 * Math.PI)) * 2 * Math.PI);
};

export const VisibleCard = ({
  cardId,
  value,
  color,
  to,
  immediate: snap,
  springConfig,
  playable,
  deckClickable,
  onCardClick,
}: VisibleCardProps) => {
  const isInteractive = playable || deckClickable;
  const outerRef = useRef<Group>(null!);
  const tiltRef = useRef<Group>(null!);
  const liftRef = useRef<Group>(null!);
  const rollRef = useRef<Group>(null!);
  const bodyMeshRef = useRef<Mesh>(null!);

  const [springs, api] = useSpring(() => ({
    px: to.position[0],
    py: to.position[1],
    pz: to.position[2],
    yaw: to.yaw,
    tilt: to.tilt,
    roll: to.roll,
    lift: 0,
    glow: 0,
    config: DEFAULT_CONFIG,
  }));

  useFrame((state) => {
    api.start({
      px: to.position[0],
      py: to.position[1],
      pz: to.position[2],
      yaw: shortestYaw(to.yaw, springs.yaw.get()),
      tilt: to.tilt,
      roll: to.roll,
      lift: playable ? PLAYABLE_LIFT : 0,
      glow: playable ? PLAYABLE_GLOW : 0,
      immediate: (key: string) => (key === 'lift' || key === 'glow') ? false : !!snap,
      config: (key: string) => (key === 'lift' || key === 'glow') ? PLAYABLE_CONFIG : (springConfig ?? DEFAULT_CONFIG),
    });

    outerRef.current.position.set(springs.px.get(), springs.py.get(), springs.pz.get());
    outerRef.current.rotation.y = springs.yaw.get();
    tiltRef.current.rotation.x = springs.tilt.get();
    rollRef.current.rotation.z = springs.roll.get();

    // Deck: pulsing glow + gentle bob; Hand: spring-driven lift + glow
    const t = state.clock.elapsedTime;
    if (deckClickable) {
      liftRef.current.position.y = DECK_BOB_AMPLITUDE * Math.sin(t * DECK_BOB_SPEED);
      if (bodyMeshRef.current) {
        (bodyMeshRef.current.material as MeshStandardMaterial).emissiveIntensity =
          DECK_GLOW_MIN + DECK_GLOW_RANGE * (0.5 + 0.5 * Math.sin(t * DECK_GLOW_SPEED));
      }
    } else {
      liftRef.current.position.y = springs.lift.get();
      if (bodyMeshRef.current) {
        (bodyMeshRef.current.material as MeshStandardMaterial).emissiveIntensity = springs.glow.get();
      }
    }
  });

  return (
    <group
      ref={outerRef}
      onClick={(e) => { e.stopPropagation(); if (isInteractive && onCardClick) { document.body.style.cursor = 'auto'; onCardClick(cardId); } }}
      onPointerOver={(e) => { e.stopPropagation(); if (isInteractive) document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); if (isInteractive) document.body.style.cursor = 'auto'; }}
    >
      <group ref={tiltRef}>
        <group ref={liftRef}>
          <group ref={rollRef}>
            <Suspense fallback={null}>
              <Card3D
                value={value}
                color={color}
                faceUp
                glowColor={PLAYABLE_GLOW_COLOR}
                bodyRef={bodyMeshRef}
              />
            </Suspense>
          </group>
        </group>
      </group>
    </group>
  );
};
