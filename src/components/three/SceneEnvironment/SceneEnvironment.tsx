import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import type { Group } from 'three';

const GROUND_SIZE = 40;
const STAR_ROTATION_SPEED = 0.005;

const RotatingStars = () => {
  const groupRef = useRef<Group>(null!);

  useFrame((_, delta) => {
    groupRef.current.rotation.y += STAR_ROTATION_SPEED * delta;
  });

  return (
    <group ref={groupRef}>
      <Stars radius={20} depth={50} count={3000} factor={3} saturation={0} fade speed={1} />
    </group>
  );
};

export const SceneEnvironment = () => (
  <>
    <RotatingStars />
    {/* Dark ground plane */}
    <mesh rotation-x={-Math.PI / 2} position-y={-1.1}>
      <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      <meshStandardMaterial color="#111111" />
    </mesh>
    {/* Fog fades edges to black */}
    <fog attach="fog" args={['#000000', 4, 18]} />
    <ambientLight intensity={1.2} />
    <directionalLight position={[0, 4, 0]} intensity={0.6} />
    <directionalLight position={[4, 2, 4]} intensity={0.3} />
    <directionalLight position={[-4, 2, -4]} intensity={0.3} />
  </>
);
