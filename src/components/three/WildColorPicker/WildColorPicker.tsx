import { useEffect, useState, useCallback } from 'react';
import { useSprings, animated } from '@react-spring/three';
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
const STAGGER_MS = 35;
const SPRING_CONFIG = { tension: 400, friction: 24 };

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

  const [springs, api] = useSprings(
    COLORS.length,
    () => ({
      from: { posX: 0, posY: -0.1, posZ: -0.01, scale: 0 },
      config: SPRING_CONFIG,
    }),
    [],
  );

  useEffect(() => {
    api.start((i) => ({
      to: visible
        ? {
            posX: SLOT_X[i],
            posY: 0,
            posZ: 0.01,
            scale: hoveredCube === i ? HOVER_SCALE : 1,
          }
        : { posX: 0, posY: -0.1, posZ: -0.01, scale: 0 },
      delay: visible ? i * STAGGER_MS : 0,
      config: SPRING_CONFIG,
    }));
  }, [api, visible, hoveredCube]);

  const handleCubeOver = useCallback((_e: unknown, i: number) => {
    setHoveredCube(i);
  }, []);

  const handleCubeOut = useCallback(() => {
    setHoveredCube(null);
  }, []);

  return (
    <group position-y={CARD_HEIGHT * 0.5 + CUBE_SIZE * 0.5 + GAP}>
      {/* Invisible hit area — covers gaps so pointer events bubble to parent */}
      <mesh position-z={0.01}>
        <planeGeometry args={[TOTAL_WIDTH + HIT_PADDING * 2, CUBE_SIZE + HIT_PADDING * 2]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      {springs.map((spring, i) => (
        <animated.group
          key={i}
          position-x={spring.posX}
          position-y={spring.posY}
          position-z={spring.posZ}
          scale={spring.scale}
        >
          <RoundedBox
            args={[CUBE_SIZE, CUBE_SIZE, CUBE_DEPTH]}
            radius={BEVEL_RADIUS}
            smoothness={4}
            onPointerOver={(e: unknown) => handleCubeOver(e, i)}
            onPointerOut={handleCubeOut}
            onClick={() => onColorSelect?.(COLORS[i])}
          >
            <meshStandardMaterial
              color={UNO_COLORS[COLORS[i]]}
              emissive={UNO_COLORS[COLORS[i]]}
              emissiveIntensity={hoveredCube === i ? HOVER_GLOW_INTENSITY : GLOW_INTENSITY}
              toneMapped={false}
              roughness={0.3}
            />
          </RoundedBox>
        </animated.group>
      ))}
    </group>
  );
};
