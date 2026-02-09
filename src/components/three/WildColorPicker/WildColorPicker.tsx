import { useState, useCallback } from 'react';
import { RoundedBox } from '@react-three/drei';
import { Color } from 'uno-engine';
import { UNO_COLORS } from '@/constants';

const COLORS = [Color.RED, Color.BLUE, Color.GREEN, Color.YELLOW] as const;

const CUBE_SIZE = 0.12;
const CUBE_DEPTH = 0.04;
const BEVEL_RADIUS = 0.02;
const GAP = 0.03;
const CARD_HEIGHT = 1.0;
const GLOW_INTENSITY = 1.5;
const HOVER_GLOW_INTENSITY = 2.5;
const HOVER_SCALE = 1.25;

const HIT_PADDING = 0.06;

/** Spread positions: 4 cubes centered in a row */
const TOTAL_WIDTH = COLORS.length * CUBE_SIZE + (COLORS.length - 1) * GAP;
const START_X = -TOTAL_WIDTH / 2 + CUBE_SIZE / 2;
const SLOT_X = COLORS.map((_, i) => START_X + i * (CUBE_SIZE + GAP));

type WildColorPickerProps = {
  visible: boolean;
  onColorSelect?: (color: Color) => void;
};

export const WildColorPicker = ({ visible, onColorSelect }: WildColorPickerProps) => {
  const [hoveredCube, setHoveredCube] = useState<number | null>(null);

  const handleCubeOver = useCallback((_e: unknown, i: number) => {
    setHoveredCube(i);
  }, []);

  const handleCubeOut = useCallback(() => {
    setHoveredCube(null);
  }, []);

  if (!visible) return null;

  return (
    <group position-y={CARD_HEIGHT * 0.5 + CUBE_SIZE * 0.5 + GAP}>
      {/* Invisible hit area — covers gaps so pointer events bubble to parent */}
      <mesh position-z={0.01}>
        <planeGeometry args={[TOTAL_WIDTH + HIT_PADDING * 2, CUBE_SIZE + HIT_PADDING * 2]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      {COLORS.map((color, i) => (
        <group
          key={i}
          position-x={SLOT_X[i]}
          position-z={0.01}
          scale={hoveredCube === i ? HOVER_SCALE : 1}
        >
          <RoundedBox
            args={[CUBE_SIZE, CUBE_SIZE, CUBE_DEPTH]}
            radius={BEVEL_RADIUS}
            smoothness={4}
            onPointerOver={(e: unknown) => handleCubeOver(e, i)}
            onPointerOut={handleCubeOut}
            onClick={() => onColorSelect?.(color)}
          >
            <meshStandardMaterial
              color={UNO_COLORS[color]}
              emissive={UNO_COLORS[color]}
              emissiveIntensity={hoveredCube === i ? HOVER_GLOW_INTENSITY : GLOW_INTENSITY}
              toneMapped={false}
              roughness={0.3}
            />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
};
