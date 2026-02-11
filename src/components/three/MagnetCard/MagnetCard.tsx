import { Text } from '@react-three/drei';
import { unoColorToHex } from '@/constants/colors';
import type { Color } from 'uno-engine';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  FACE_OFFSET,
  bodyGeo,
} from './MagnetCard.constants';

type MagnetCardProps = {
  cardId: string;
  color?: Color;
  value?: string | number;
  position?: [number, number, number];
  yaw?: number;
  tilt?: number;
  roll?: number;
  faceUp?: boolean;
};

export const MagnetCard = ({
  cardId,
  color,
  value,
  position = [0, 0, 0],
  yaw = 0,
  tilt = 0,
  roll = 0,
  faceUp = false,
}: MagnetCardProps) => {
  const faceColor = unoColorToHex(color);
  const label = `${value ?? '?'}`;

  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <group rotation={[tilt, 0, 0]}>
        <group rotation={[0, 0, roll]}>
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
            position={[
              -CARD_WIDTH / 2 + 0.08,
              CARD_HEIGHT / 2 - 0.1,
              FACE_OFFSET + 0.001,
            ]}
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
      </group>
    </group>
  );
};
