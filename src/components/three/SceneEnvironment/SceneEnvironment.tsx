import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Clouds, Cloud } from '@react-three/drei';
import type { Group } from 'three';
import { useAppSelector } from '@/store/hooks';
import { selectMode } from '@/store/slices/theme';

const GROUND_SIZE = 40;
const ROTATION_SPEED = 0.005;

const THEME_3D = {
  dark: {
    ground: '#111111',
    fog: '#000000',
    fogNear: 4,
    fogFar: 18,
    ambient: 1.2,
    topLight: 0.6,
    sideLight: 0.3,
  },
  light: {
    ground: '#d4cfc7',
    fog: '#e8e4df',
    fogNear: 6,
    fogFar: 22,
    ambient: 1.8,
    topLight: 0.8,
    sideLight: 0.5,
  },
} as const;

const RotatingStars = () => {
  const groupRef = useRef<Group>(null!);

  useFrame((_, delta) => {
    groupRef.current.rotation.y += ROTATION_SPEED * delta;
  });

  return (
    <group ref={groupRef}>
      <Stars
        radius={20}
        depth={50}
        count={3000}
        factor={3}
        saturation={0}
        fade
        speed={1}
      />
    </group>
  );
};

const RotatingClouds = () => {
  const groupRef = useRef<Group>(null!);

  useFrame((_, delta) => {
    groupRef.current.rotation.y += ROTATION_SPEED * 0.3 * delta;
  });

  return (
    <group ref={groupRef}>
      <Clouds material={undefined}>
        <Cloud
          seed={1}
          segments={40}
          bounds={[10, 2, 10]}
          volume={6}
          color="#ffffff"
          fade={25}
          speed={0.2}
          growth={4}
          opacity={0.6}
          position={[0, 6, -5]}
        />
        <Cloud
          seed={2}
          segments={30}
          bounds={[8, 1.5, 8]}
          volume={4}
          color="#f0ece6"
          fade={20}
          speed={0.15}
          growth={3}
          opacity={0.5}
          position={[-4, 5, 3]}
        />
        <Cloud
          seed={3}
          segments={25}
          bounds={[6, 1.5, 6]}
          volume={3}
          color="#f5f0ea"
          fade={15}
          speed={0.25}
          growth={3}
          opacity={0.4}
          position={[5, 7, 2]}
        />
      </Clouds>
    </group>
  );
};

export const SceneEnvironment = () => {
  const mode = useAppSelector(selectMode);
  const t = THEME_3D[mode];

  return (
    <>
      {mode === 'dark' ? <RotatingStars /> : <RotatingClouds />}
      <mesh rotation-x={-Math.PI / 2} position-y={-1.1}>
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
        <meshStandardMaterial color={t.ground} />
      </mesh>
      <fog key={mode} attach="fog" args={[t.fog, t.fogNear, t.fogFar]} />
      <ambientLight intensity={t.ambient} />
      <directionalLight position={[0, 4, 0]} intensity={t.topLight} />
      <directionalLight position={[4, 2, 4]} intensity={t.sideLight} />
      <directionalLight position={[-4, 2, -4]} intensity={t.sideLight} />
    </>
  );
};
