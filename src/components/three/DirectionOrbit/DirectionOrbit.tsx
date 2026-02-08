import { useRef, useMemo, useEffect } from 'react';
import { useSpring } from '@react-spring/three';
import {
  BufferGeometry,
  BufferAttribute,
  Color as ThreeColor,
  DoubleSide,
  type Mesh,
} from 'three';
import { Color } from 'uno-engine';
import { useAppSelector } from '@/store/hooks';
import { selectReducedMotion } from '@/store/slices/theme';
import type { PlayDirection } from '@/types/game';
import {
  useOrbitAnimation,
  TAIL_SAMPLES,
  VERTS_PER_SAMPLE,
} from './useOrbitAnimation';

const UNO_COLORS: Record<number, string> = {
  [Color.RED]: '#ef6f6f',
  [Color.BLUE]: '#5b8ef5',
  [Color.GREEN]: '#4dcb7a',
  [Color.YELLOW]: '#f0b84d',
};
const WILD_COLOR = '#ffffff';

const ARROW_INDICES = [
  0, 1, 2,
  3, 5, 4,
  0, 3, 1, 1, 3, 4,
  1, 4, 2, 2, 4, 5,
  2, 5, 0, 0, 5, 3,
];

const makeArrowGeo = () => {
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(18), 3));
  geo.setIndex(ARROW_INDICES);
  return geo;
};

const makeTailGeo = () => {
  const geo = new BufferGeometry();
  const positions = new Float32Array(TAIL_SAMPLES * VERTS_PER_SAMPLE * 3);
  geo.setAttribute('position', new BufferAttribute(positions, 3));

  const indices: number[] = [];
  for (let i = 0; i < TAIL_SAMPLES - 1; i++) {
    const v = i * VERTS_PER_SAMPLE;
    const n = v + VERTS_PER_SAMPLE;
    // Top
    indices.push(v, n, v + 1, n, n + 1, v + 1);
    // Bottom
    indices.push(v + 2, v + 3, n + 2, n + 2, v + 3, n + 3);
    // Left side
    indices.push(v, v + 2, n, n, v + 2, n + 2);
    // Right side
    indices.push(v + 1, n + 1, v + 3, n + 1, n + 3, v + 3);
  }
  geo.setIndex(indices);
  return geo;
};

type DirectionOrbitProps = {
  direction: PlayDirection;
  activeColor: Color | undefined;
};

export const DirectionOrbit = ({
  direction,
  activeColor,
}: DirectionOrbitProps) => {
  const arrow1Ref = useRef<Mesh>(null!);
  const tail1Ref = useRef<Mesh>(null!);
  const arrow2Ref = useRef<Mesh>(null!);
  const tail2Ref = useRef<Mesh>(null!);
  const reducedMotion = useAppSelector(selectReducedMotion);

  const arrow1Geo = useMemo(() => makeArrowGeo(), []);
  const tail1Geo = useMemo(() => makeTailGeo(), []);
  const arrow2Geo = useMemo(() => makeArrowGeo(), []);
  const tail2Geo = useMemo(() => makeTailGeo(), []);

  const targetHex = activeColor != null ? UNO_COLORS[activeColor] : WILD_COLOR;

  const [{ colorR, colorG, colorB }, api] = useSpring(() => {
    const c = new ThreeColor(targetHex);
    return {
      colorR: c.r,
      colorG: c.g,
      colorB: c.b,
      config: { tension: 120, friction: 14 },
    };
  });

  useEffect(() => {
    const c = new ThreeColor(targetHex);
    api.start({ colorR: c.r, colorG: c.g, colorB: c.b });
  }, [targetHex, api]);

  useOrbitAnimation({
    arrow1Ref,
    tail1Ref,
    arrow2Ref,
    tail2Ref,
    direction,
    colorR,
    colorG,
    colorB,
    reducedMotion,
  });

  return (
    <group>
      <mesh ref={arrow1Ref} geometry={arrow1Geo}>
        <meshBasicMaterial color={targetHex} side={DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={tail1Ref} geometry={tail1Geo}>
        <meshBasicMaterial color={targetHex} side={DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={arrow2Ref} geometry={arrow2Geo}>
        <meshBasicMaterial color={targetHex} side={DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={tail2Ref} geometry={tail2Geo}>
        <meshBasicMaterial color={targetHex} side={DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
};
