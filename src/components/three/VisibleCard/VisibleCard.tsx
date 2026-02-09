import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { Card3D } from '@/components/three/Card3D';
import type { Value, Color } from 'uno-engine';
import type { CardPlacement } from '@/utils/zoneLayout';

/** Higher = faster snap to target. 10 ≈ smooth but responsive. */
const LERP_SPEED = 10;

type VisibleCardProps = {
  cardId: string;
  value: Value;
  color: Color | undefined;
  to: CardPlacement;
  positionMap: { current: Map<string, CardPlacement> };
};

export const VisibleCard = ({
  cardId,
  value,
  color,
  to,
  positionMap,
}: VisibleCardProps) => {
  const groupRef = useRef<Group>(null!);
  const initializedRef = useRef(false);

  useFrame((_, delta) => {
    const g = groupRef.current;

    // First frame: snap to last known position (or target if brand new card)
    if (!initializedRef.current) {
      initializedRef.current = true;
      const prev = positionMap.current.get(cardId);
      const start = prev ?? to;
      g.position.set(...start.position);
      g.rotation.set(...start.rotation);
    }

    // Exponential decay toward target — handles interruption naturally
    const factor = 1 - Math.exp(-LERP_SPEED * delta);
    g.position.x += (to.position[0] - g.position.x) * factor;
    g.position.y += (to.position[1] - g.position.y) * factor;
    g.position.z += (to.position[2] - g.position.z) * factor;
    g.rotation.x += (to.rotation[0] - g.rotation.x) * factor;
    g.rotation.y += (to.rotation[1] - g.rotation.y) * factor;
    g.rotation.z += (to.rotation[2] - g.rotation.z) * factor;

    // Write current position back so remounts start from here
    positionMap.current.set(cardId, {
      position: [g.position.x, g.position.y, g.position.z],
      rotation: [g.rotation.x, g.rotation.y, g.rotation.z],
      faceUp: to.faceUp,
    });
  });

  return (
    <group ref={groupRef}>
      <Card3D value={value} color={color} faceUp={to.faceUp} />
    </group>
  );
};
