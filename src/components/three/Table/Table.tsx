import type { ReactNode } from 'react';
import { MeshReflectorMaterial, RoundedBox, useTexture } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { RepeatWrapping } from 'three';
import woodDiffUrl from '@/assets/textures/wood_table_diff.jpg';
import woodRoughUrl from '@/assets/textures/wood_table_rough.jpg';

const TABLE_WIDTH = 4;
const TABLE_HEIGHT = 0.1;
const TABLE_DEPTH = 4;
const TABLE_RADIUS = 0.05;
export const TABLE_SURFACE_Y = TABLE_HEIGHT / 2 + 0.001;

type TableProps = {
  children?: ReactNode;
};

export const Table = ({ children }: TableProps) => {
  const [diffMap, roughMap] = useTexture([woodDiffUrl, woodRoughUrl]);

  diffMap.wrapS = diffMap.wrapT = RepeatWrapping;
  diffMap.repeat.set(2, 2);
  roughMap.wrapS = roughMap.wrapT = RepeatWrapping;
  roughMap.repeat.set(2, 2);

  const { posZ } = useSpring({
    from: { posZ: 15 },
    to: { posZ: -2 },
    config: { tension: 80, friction: 20 },
  });

  return (
    <animated.group position-x={0} position-y={-1} position-z={posZ}>
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
