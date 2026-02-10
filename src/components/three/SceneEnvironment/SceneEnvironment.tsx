import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import type { Group } from 'three';

const H = 6; // half-size of room
const WALL_SIZE = H * 2;
const POST = 0.6; // frame post width
const DEPTH = 0.3; // frame thickness (z-depth)
const INNER = WALL_SIZE - POST * 2; // window opening size

type WindowWallProps = {
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
};

/** A wall frame made of 4 strips with an open center (window). */
const WindowWall = ({ color, position, rotation }: WindowWallProps) => {
  const edgeOffset = (WALL_SIZE - POST) / 2; // center of each strip
  const mat = <meshStandardMaterial color={color} />;

  return (
    <group position={position} rotation={rotation}>
      {/* Top strip */}
      <mesh position-y={edgeOffset}>
        <boxGeometry args={[WALL_SIZE, POST, DEPTH]} />
        {mat}
      </mesh>
      {/* Bottom strip */}
      <mesh position-y={-edgeOffset}>
        <boxGeometry args={[WALL_SIZE, POST, DEPTH]} />
        {mat}
      </mesh>
      {/* Left strip */}
      <mesh position-x={-edgeOffset}>
        <boxGeometry args={[POST, INNER, DEPTH]} />
        {mat}
      </mesh>
      {/* Right strip */}
      <mesh position-x={edgeOffset}>
        <boxGeometry args={[POST, INNER, DEPTH]} />
        {mat}
      </mesh>
    </group>
  );
};

type WallProps = {
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
};

const Wall = ({ color, position, rotation }: WallProps) => (
  <mesh position={position} rotation={rotation}>
    <planeGeometry args={[WALL_SIZE, WALL_SIZE]} />
    <meshStandardMaterial color={color} />
  </mesh>
);

// Saturated tints per player seat (south=visitor, west=Meio, north=Dong, east=Oscar)
const WALL_SOUTH = '#9b59b6'; // visitor — purple
const WALL_WEST = '#e74c3c';  // Meio — red
const WALL_NORTH = '#3498db'; // Dong — blue
const WALL_EAST = '#2ecc71';  // Oscar — green
const SURFACE = '#f0f0f0';    // floor

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
    {/* Window walls: each faces inward */}
    <WindowWall color={WALL_SOUTH} position={[0, 0, H]} rotation={[0, Math.PI, 0]} />
    <WindowWall color={WALL_NORTH} position={[0, 0, -H]} rotation={[0, 0, 0]} />
    <WindowWall color={WALL_WEST} position={[-H, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
    <WindowWall color={WALL_EAST} position={[H, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
    {/* Floor & ceiling */}
    <Wall color={SURFACE} position={[0, -H, 0]} rotation={[-Math.PI / 2, 0, 0]} />
    <Wall color="#2a2a2a" position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} />
    <ambientLight intensity={1.2} />
    <directionalLight position={[0, 4, 0]} intensity={0.6} />
    <directionalLight position={[4, 2, 4]} intensity={0.3} />
    <directionalLight position={[-4, 2, -4]} intensity={0.3} />
  </>
);
