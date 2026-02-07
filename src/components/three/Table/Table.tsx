import { MeshReflectorMaterial, RoundedBox } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';

export const Table = () => {
  const { posZ } = useSpring({
    from: { posZ: 15 },
    to: { posZ: -2 },
    config: { tension: 80, friction: 20 },
  });

  return (
    <animated.group position-x={0} position-y={-1} position-z={posZ}>
      <RoundedBox args={[4, 0.1, 4]} radius={0.05} smoothness={4}>
        <MeshReflectorMaterial
          color="#cecece"
          roughness={0.8}
          metalness={0.1}
          mirror={0.5}
          blur={[100, 100]}
          mixBlur={1}
          mixStrength={40}
          mixContrast={1}
          resolution={1024}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
        />
      </RoundedBox>
    </animated.group>
  );
};
