const H = 6; // half-size of room

type WallProps = {
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
};

const Wall = ({ color, position, rotation }: WallProps) => (
  <mesh position={position} rotation={rotation}>
    <planeGeometry args={[H * 2, H * 2]} />
    <meshStandardMaterial color={color} />
  </mesh>
);

// Pastel tints per player seat (south=visitor, west=Meio, north=Dong, east=Oscar)
const WALL_SOUTH = '#e8d5f0'; // visitor — soft purple
const WALL_WEST = '#f5d5d0';  // Meio — soft red
const WALL_NORTH = '#d0e0f5'; // Dong — soft blue
const WALL_EAST = '#d0f0d8';  // Oscar — soft green
const SURFACE = '#f0f0f0';    // floor & ceiling

export const SceneEnvironment = () => (
  <>
    {/* Walls: each faces inward */}
    <Wall color={WALL_SOUTH} position={[0, 0, H]} rotation={[0, Math.PI, 0]} />
    <Wall color={WALL_NORTH} position={[0, 0, -H]} rotation={[0, 0, 0]} />
    <Wall color={WALL_WEST} position={[-H, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
    <Wall color={WALL_EAST} position={[H, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
    {/* Floor & ceiling */}
    <Wall color={SURFACE} position={[0, -H, 0]} rotation={[-Math.PI / 2, 0, 0]} />
    <Wall color="#2a2a2a" position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} />
    <ambientLight intensity={1.2} />
    <directionalLight position={[0, 4, 0]} intensity={0.6} />
    <directionalLight position={[4, 2, 4]} intensity={0.3} />
    <directionalLight position={[-4, 2, -4]} intensity={0.3} />
  </>
);
