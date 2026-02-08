import { MeshReflectorMaterial, RoundedBox, useTexture } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { RepeatWrapping } from 'three';
import woodDiffUrl from '@/assets/textures/wood_table_diff.jpg';
import woodRoughUrl from '@/assets/textures/wood_table_rough.jpg';

export const Table = () => {
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
      <RoundedBox args={[4, 0.1, 4]} radius={0.05} smoothness={4}>
        <MeshReflectorMaterial
          map={diffMap}
          roughnessMap={roughMap}
          roughness={0}
          metalness={0}
          mirror={0.94}
          blur={[100, 100]}
          mixBlur={1}
          mixStrength={15}
          mixContrast={1}
          resolution={128}
          depthScale={0.4}
          minDepthThreshold={0.1}
          maxDepthThreshold={1.4}
        />
      </RoundedBox>
    </animated.group>
  );
};
