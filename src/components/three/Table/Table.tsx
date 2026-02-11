import { type ReactNode, useEffect, useRef } from 'react';
import { animated, useSpring } from '@react-spring/three';
import { MeshReflectorMaterial, RoundedBox } from '@react-three/drei';
import { useAppSelector } from '@/store/hooks';
import { selectMode } from '@/store/slices/theme';
import {
  TABLE_WIDTH,
  TABLE_HEIGHT,
  TABLE_DEPTH,
  TABLE_RADIUS,
  TABLE_REST_POSITION,
  tableColorS,
} from './Table.constants';

export { TABLE_SURFACE_Y } from './Table.constants';

type TableProps = {
  children?: ReactNode;
  startEntrance?: boolean;
  onReady?: () => void;
};

export const Table = ({
  children,
  startEntrance = true,
  onReady,
}: TableProps) => {
  const mode = useAppSelector(selectMode);
  const tableColor = tableColorS[mode];
  const firedRef = useRef(false);

  const [{ position }, api] = useSpring(() => ({
    position: [0, -1, 15] as [number, number, number],
    config: { tension: 80, friction: 20 },
  }));

  // Start the entrance animation when startEntrance becomes true.
  useEffect(() => {
    if (!startEntrance) return;
    api.start({
      position: TABLE_REST_POSITION,
      onRest() {
        if (!firedRef.current) {
          firedRef.current = true;
          onReady?.();
        }
      },
    });
  }, [api, startEntrance, onReady]);

  return (
    <animated.group position={position as unknown as [number, number, number]}>
      {/* Reflector surface — inset to fit inside rounded edges */}
      <mesh rotation-x={-Math.PI / 2} position-y={TABLE_HEIGHT / 2 + 0.001}>
        <planeGeometry
          args={[
            TABLE_WIDTH - TABLE_RADIUS * 2,
            TABLE_DEPTH - TABLE_RADIUS * 2,
          ]}
        />
        <MeshReflectorMaterial
          color={tableColor}
          roughness={0.5}
          metalness={mode === 'dark' ? 0.1 : 0.05}
          mirror={0.15}
          blur={[200, 200]}
          mixBlur={1}
          mixStrength={4}
          mixContrast={1}
          resolution={512}
          depthScale={0.3}
          minDepthThreshold={0.1}
          maxDepthThreshold={1}
        />
      </mesh>

      {/* Table body */}
      <RoundedBox
        args={[TABLE_WIDTH, TABLE_HEIGHT, TABLE_DEPTH]}
        radius={TABLE_RADIUS}
        smoothness={4}
      >
        <meshStandardMaterial
          color={tableColor}
          roughness={0.8}
          metalness={0}
        />
      </RoundedBox>

      {children}
    </animated.group>
  );
};
