import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useAppSelector } from '@/store/hooks';
import { selectMode } from '@/store/slices/theme';
import { DRAW_PILE_POSITION } from '@/constants';
import {
  ARROW_BASE_Y,
  ARROW_BOUNCE_AMPLITUDE,
  ARROW_BOUNCE_SPEED,
  ARROW_COLOR,
  ARROW_EMISSIVE_INTENSITY,
} from './DeckArrow.constants';

type DeckArrowProps = {
  visible: boolean;
};

export const DeckArrow = ({ visible }: DeckArrowProps) => {
  const groupRef = useRef<Group>(null!);
  const mode = useAppSelector(selectMode);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.visible = visible;
    if (!visible) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y =
      ARROW_BASE_Y + Math.sin(t * ARROW_BOUNCE_SPEED) * ARROW_BOUNCE_AMPLITUDE;
  });

  return (
    <group
      ref={groupRef}
      position={[DRAW_PILE_POSITION[0], ARROW_BASE_Y, DRAW_PILE_POSITION[2]]}
      rotation={[0, 0, Math.PI]}
      visible={false}
    >
      {/* Arrow shaft */}
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.16, 8]} />
        <meshStandardMaterial
          color={ARROW_COLOR[mode]}
          emissive={ARROW_COLOR[mode]}
          emissiveIntensity={ARROW_EMISSIVE_INTENSITY}
          toneMapped={false}
        />
      </mesh>
      {/* Arrow head (cone) */}
      <mesh position={[0, 0, 0]}>
        <coneGeometry args={[0.08, 0.12, 8]} />
        <meshStandardMaterial
          color={ARROW_COLOR[mode]}
          emissive={ARROW_COLOR[mode]}
          emissiveIntensity={ARROW_EMISSIVE_INTENSITY}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};
