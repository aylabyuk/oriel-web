import { Text } from '@react-three/drei';
import { Shape, ExtrudeGeometry } from 'three';
import { unoColorToHex } from '@/constants/colors';
import type { Color } from 'uno-engine';

const CARD_WIDTH = 0.7;
const CARD_HEIGHT = 1.0;
const CARD_DEPTH = 0.003;
const CARD_RADIUS = 0.04;
const FACE_OFFSET = CARD_DEPTH / 2 + 0.001;

const createRoundedRectShape = (w: number, h: number, r: number) => {
  const shape = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
};

const cardShape = createRoundedRectShape(CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);

const bodyGeo = new ExtrudeGeometry(cardShape, {
  depth: CARD_DEPTH,
  bevelEnabled: false,
});
bodyGeo.translate(0, 0, -CARD_DEPTH / 2);

type MagnetCardProps = {
  cardId: string;
  color?: Color;
  value?: string | number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  faceUp?: boolean;
};

export const MagnetCard = ({
  cardId,
  color,
  value,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  faceUp = false,
}: MagnetCardProps) => {
  const faceColor = unoColorToHex(color);
  const label = `${value ?? '?'}`;

  return (
    <group position={position} rotation={rotation}>
      {/* Card body */}
      <mesh geometry={bodyGeo}>
        <meshStandardMaterial color="#cccccc" roughness={0.8} />
      </mesh>

      {/* Front face — card color */}
      <mesh position={[0, 0, FACE_OFFSET]}>
        <planeGeometry args={[CARD_WIDTH - 0.02, CARD_HEIGHT - 0.02]} />
        <meshStandardMaterial color={faceColor} />
      </mesh>

      {/* Back face — gray */}
      <mesh position={[0, 0, -FACE_OFFSET]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CARD_WIDTH - 0.02, CARD_HEIGHT - 0.02]} />
        <meshStandardMaterial color="#666666" />
      </mesh>

      {/* Front debug text — value */}
      <Text
        position={[-CARD_WIDTH / 2 + 0.08, CARD_HEIGHT / 2 - 0.1, FACE_OFFSET + 0.001]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="left"
        anchorY="top"
        outlineWidth={0.008}
        outlineColor="#000000"
      >
        {label}
      </Text>

      {/* Front debug text — cardId */}
      <Text
        position={[0, -0.2, FACE_OFFSET + 0.001]}
        fontSize={0.055}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.006}
        outlineColor="#000000"
        maxWidth={CARD_WIDTH - 0.08}
      >
        {cardId}
      </Text>

      {/* Facing indicator — small dot with white border */}
      <mesh position={[0, 0.38, FACE_OFFSET + 0.001]}>
        <circleGeometry args={[0.035, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.38, FACE_OFFSET + 0.002]}>
        <circleGeometry args={[0.02, 12]} />
        <meshStandardMaterial color={faceUp ? '#22c55e' : '#ef4444'} />
      </mesh>
    </group>
  );
};
