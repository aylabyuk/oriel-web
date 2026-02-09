import { Suspense } from 'react';
import { animated, useSpring } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import { Card3D } from '@/components/three/Card3D';
import type { Value, Color } from 'uno-engine';
import type { CardPlacement } from '@/utils/zoneLayout';

type VisibleCardProps = {
  cardId: string;
  value: Value;
  color: Color | undefined;
  to: CardPlacement;
};

export const VisibleCard = ({
  value,
  color,
  to,
}: VisibleCardProps) => {
  // Imperative spring — initialized once on mount, updated via api.start().
  const [{ position, rotation }, api] = useSpring(() => ({
    position: [...to.position] as [number, number, number],
    rotation: [...to.rotation] as [number, number, number],
    config: { tension: 170, friction: 26 },
  }));

  // Drive the spring every frame (reference repo pattern).
  // R3F updates the useFrame callback on each render, so `to` is always fresh.
  // In v9, api.start() with an unchanged target is a no-op.
  useFrame(() => {
    api.start({
      position: [to.position[0], to.position[1], to.position[2]],
      rotation: [to.rotation[0], to.rotation[1], to.rotation[2]],
    });
  });

  return (
    <animated.group
      position={position as unknown as [number, number, number]}
      rotation={rotation as unknown as [number, number, number]}
    >
      <Suspense fallback={null}>
        <Card3D value={value} color={color} faceUp={to.faceUp} />
      </Suspense>
    </animated.group>
  );
};
