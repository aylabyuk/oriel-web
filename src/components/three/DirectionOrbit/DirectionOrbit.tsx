import { useRef, useMemo, useEffect } from 'react';
import { useSpring, animated, to } from '@react-spring/three';
import {
  BufferGeometry,
  BufferAttribute,
  Color as ThreeColor,
  DoubleSide,
  type Mesh,
} from 'three';
import type { Color } from 'uno-engine';
import { useAppSelector } from '@/store/hooks';
import { selectReducedMotion } from '@/store/slices/theme';
import { unoColorToHex } from '@/constants';
import type { PlayDirection } from '@/types/game';
import {
  useOrbitAnimation,
  TAIL_SAMPLES,
  VERTS_PER_SAMPLE,
} from './useOrbitAnimation';

const ARROW_INDICES = [
  0, 1, 2, 3, 5, 4, 0, 3, 1, 1, 3, 4, 1, 4, 2, 2, 4, 5, 2, 5, 0, 0, 5, 3,
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

  const targetHex = unoColorToHex(activeColor);

  const [
    {
      colorR,
      colorG,
      colorB,
      opacity,
      entranceScale,
      dirMult,
      reverseScale,
      glowBoost,
    },
    api,
  ] = useSpring(() => {
    const c = new ThreeColor(targetHex);
    return {
      colorR: c.r,
      colorG: c.g,
      colorB: c.b,
      opacity: 0,
      entranceScale: 0,
      dirMult: direction === 'clockwise' ? 1 : -1,
      reverseScale: 1,
      glowBoost: 1,
      config: { tension: 120, friction: 14 },
    };
  });

  useEffect(() => {
    api.start({ opacity: 1, entranceScale: 1 });
  }, [api]);

  useEffect(() => {
    const c = new ThreeColor(targetHex);
    api.start({ colorR: c.r, colorG: c.g, colorB: c.b });
  }, [targetHex, api]);

  // Animate direction reversal with scale pop + glow burst
  const prevDirectionRef = useRef(direction);
  useEffect(() => {
    if (direction === prevDirectionRef.current) return;
    prevDirectionRef.current = direction;

    const newDirMult = direction === 'clockwise' ? 1 : -1;

    // Smooth decelerate → reverse
    api.start({
      dirMult: newDirMult,
      config: { tension: 60, friction: 14 },
    });

    if (!reducedMotion) {
      // Quick scale pop + glow burst, then settle back
      api.start({
        from: { reverseScale: 1.2, glowBoost: 1.8 },
        to: { reverseScale: 1, glowBoost: 1 },
        config: { tension: 180, friction: 12 },
      });
    }
  }, [direction, api, reducedMotion]);

  useOrbitAnimation({
    arrow1Ref,
    tail1Ref,
    arrow2Ref,
    tail2Ref,
    dirMult,
    colorR,
    colorG,
    colorB,
    opacity,
    glowBoost,
    reducedMotion,
  });

  return (
    <animated.group scale={to([entranceScale, reverseScale], (e, r) => e * r)}>
      <mesh ref={arrow1Ref} geometry={arrow1Geo}>
        <meshBasicMaterial
          color={targetHex}
          side={DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>
      <mesh ref={tail1Ref} geometry={tail1Geo}>
        <meshBasicMaterial
          color={targetHex}
          side={DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>
      <mesh ref={arrow2Ref} geometry={arrow2Geo}>
        <meshBasicMaterial
          color={targetHex}
          side={DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>
      <mesh ref={tail2Ref} geometry={tail2Geo}>
        <meshBasicMaterial
          color={targetHex}
          side={DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>
    </animated.group>
  );
};
