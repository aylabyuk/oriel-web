import { type ReactNode, useEffect, useMemo, useRef } from 'react';
import { animated, useSpring } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial, RoundedBox, useTexture } from '@react-three/drei';
import { RepeatWrapping, type Texture } from 'three';
import woodDiffUrl from '@/assets/textures/wood_table_diff.jpg';
import woodRoughUrl from '@/assets/textures/wood_table_rough.jpg';

const configureTexture = (tex: Texture) => {
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
};

const TABLE_WIDTH = 4;
const TABLE_HEIGHT = 0.1;
const TABLE_DEPTH = 4;
const TABLE_RADIUS = 0.05;
export const TABLE_SURFACE_Y = TABLE_HEIGHT / 2 + 0.001;
const TABLE_REST_POSITION: [number, number, number] = [0, -1, -2];

type TableProps = {
  children?: ReactNode;
  onReady?: () => void;
};

export const Table = ({ children, onReady }: TableProps) => {
  const [rawDiff, rawRough] = useTexture([woodDiffUrl, woodRoughUrl]);
  const diffMap = useMemo(() => configureTexture(rawDiff), [rawDiff]);
  const roughMap = useMemo(() => configureTexture(rawRough), [rawRough]);

  const firedRef = useRef(false);

  const [{ position }, api] = useSpring(() => ({
    position: [0, -1, 15] as [number, number, number],
    config: { tension: 80, friction: 20 },
  }));

  // Start the entrance animation once on mount.
  useEffect(() => {
    api.start({
      position: TABLE_REST_POSITION,
      onRest() {
        if (!firedRef.current) {
          firedRef.current = true;
          onReady?.();
        }
      },
    });
  }, [api, onReady]);

  // Keep the spring driven every frame (same pattern as VisibleCard).
  useFrame(() => {
    api.start({ position: TABLE_REST_POSITION });
  });

  return (
    <animated.group position={position as unknown as [number, number, number]}>
      {/* Reflector surface — inset to fit inside rounded edges */}
      <mesh rotation-x={-Math.PI / 2} position-y={TABLE_HEIGHT / 2 + 0.001}>
        <planeGeometry args={[TABLE_WIDTH - TABLE_RADIUS * 2, TABLE_DEPTH - TABLE_RADIUS * 2]} />
        <MeshReflectorMaterial
          map={diffMap}
          roughnessMap={roughMap}
          roughness={0.1}
          metalness={0.04}
          mirror={0.07}
          blur={[100, 100]}
          mixBlur={1}
          mixStrength={15}
          mixContrast={1}
          resolution={1024}
          depthScale={0.4}
          minDepthThreshold={0.1}
          maxDepthThreshold={1}
        />
      </mesh>

      {/* Table body */}
      <RoundedBox args={[TABLE_WIDTH, TABLE_HEIGHT, TABLE_DEPTH]} radius={TABLE_RADIUS} smoothness={4}>
        <meshStandardMaterial
          map={diffMap}
          roughnessMap={roughMap}
          roughness={0.8}
          metalness={0}
        />
      </RoundedBox>

      {children}
    </animated.group>
  );
};
