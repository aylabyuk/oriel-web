import { Suspense, useRef } from 'react';
import { useSpring } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { Card3D } from '@/components/three/Card3D';
import type { Value, Color } from 'uno-engine';
import type { CardPlacement } from '@/utils/zoneLayout';
import type { SpringConfig } from '@/utils/computeAllTargets';

const DEFAULT_CONFIG: SpringConfig = { tension: 300, friction: 35 };

const PLAYABLE_LIFT = 0.15;
const PLAYABLE_GLOW_COLOR = '#ffffff';
const PLAYABLE_GLOW = 0.6;

type VisibleCardProps = {
  cardId: string;
  value: Value;
  color: Color | undefined;
  to: CardPlacement;
  immediate?: boolean;
  springConfig?: SpringConfig;
  playable?: boolean;
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
  value,
  color,
  to,
  immediate: snap,
  springConfig,
  playable,
}: VisibleCardProps) => {
  const outerRef = useRef<Group>(null!);
  const tiltRef = useRef<Group>(null!);
  const liftRef = useRef<Group>(null!);
  const rollRef = useRef<Group>(null!);

  // Spring yaw/tilt/roll independently — each axis interpolates without
  // cross-axis interference, so the staging→turned flip is always a clean
  // tilt rotation (PI/2 → 0) regardless of player seat angle.
  const [springs, api] = useSpring(() => ({
    px: to.position[0],
    py: to.position[1],
    pz: to.position[2],
    yaw: to.yaw,
    tilt: to.tilt,
    roll: to.roll,
    lift: 0,
    config: DEFAULT_CONFIG,
  }));

  useFrame(() => {
    api.start({
      px: to.position[0],
      py: to.position[1],
      pz: to.position[2],
      yaw: shortestYaw(to.yaw, springs.yaw.get()),
      tilt: to.tilt,
      roll: to.roll,
      lift: playable ? PLAYABLE_LIFT : 0,
      immediate: snap,
      config: springConfig ?? DEFAULT_CONFIG,
    });

    // Apply spring values imperatively via nested rotation groups:
    //   outer:  position + Ry(yaw)   — player facing direction
    //   middle: Rx(tilt)             — face orientation
    //   lift:   position-y inside tilt — lifts along tilted surface normal
    //   inner:  Rz(roll)             — jitter / scatter
    outerRef.current.position.set(springs.px.get(), springs.py.get(), springs.pz.get());
    outerRef.current.rotation.y = springs.yaw.get();
    tiltRef.current.rotation.x = springs.tilt.get();
    liftRef.current.position.y = springs.lift.get();
    rollRef.current.rotation.z = springs.roll.get();
  });

  return (
    <group
      ref={outerRef}
      onPointerOver={(e) => { e.stopPropagation(); if (playable) document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); if (playable) document.body.style.cursor = 'auto'; }}
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
                glowIntensity={playable ? PLAYABLE_GLOW : 0}
              />
            </Suspense>
          </group>
        </group>
      </group>
    </group>
  );
};
