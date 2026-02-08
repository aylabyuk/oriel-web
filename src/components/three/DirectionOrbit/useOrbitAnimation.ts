import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, BufferAttribute, MeshBasicMaterial } from 'three';
import type { SpringValue } from '@react-spring/three';
import type { PlayDirection } from '@/types/game';

const ORBIT_RADIUS = 1.2;
const ORBIT_Y = 0.056;
const ORBIT_SPEED = 1.0; // rad/s — full revolution ~6.3s
/** HDR multiplier — pushes color above 1.0 so bloom catches it */
const GLOW_INTENSITY = 2.0;

const ARROW_LENGTH = 0.28;
const ARROW_HALF_WIDTH = 0.16;
const ARROW_HALF_HEIGHT = 0.025;

const TAIL_ARC = 1.2; // radians of arc each tail covers (~69°)
const TAIL_HALF_WIDTH = 0.04;
const TAIL_HALF_HEIGHT = 0.018;

/** Tail sample count */
export const TAIL_SAMPLES = 16;
const TAIL_STEP = TAIL_ARC / (TAIL_SAMPLES - 1);

/** Vertices per tail sample */
export const VERTS_PER_SAMPLE = 4;

type UseOrbitAnimationArgs = {
  arrow1Ref: React.RefObject<Mesh | null>;
  tail1Ref: React.RefObject<Mesh | null>;
  arrow2Ref: React.RefObject<Mesh | null>;
  tail2Ref: React.RefObject<Mesh | null>;
  direction: PlayDirection;
  colorR: SpringValue<number>;
  colorG: SpringValue<number>;
  colorB: SpringValue<number>;
  reducedMotion: boolean;
};

const updateArrow = (mesh: Mesh, angle: number, dirMult: number) => {
  const hx = Math.cos(angle) * ORBIT_RADIUS;
  const hz = Math.sin(angle) * ORBIT_RADIUS;
  const dtx = -Math.sin(angle) * dirMult;
  const dtz = Math.cos(angle) * dirMult;
  const apx = -dtz;
  const apz = dtx;

  const tipX = hx + dtx * ARROW_LENGTH;
  const tipZ = hz + dtz * ARROW_LENGTH;
  const b1X = hx + apx * ARROW_HALF_WIDTH;
  const b1Z = hz + apz * ARROW_HALF_WIDTH;
  const b2X = hx - apx * ARROW_HALF_WIDTH;
  const b2Z = hz - apz * ARROW_HALF_WIDTH;
  const yTop = ORBIT_Y + ARROW_HALF_HEIGHT;
  const yBot = ORBIT_Y - ARROW_HALF_HEIGHT;

  const pos = mesh.geometry.getAttribute('position') as BufferAttribute;
  pos.setXYZ(0, tipX, yTop, tipZ);
  pos.setXYZ(1, b1X, yTop, b1Z);
  pos.setXYZ(2, b2X, yTop, b2Z);
  pos.setXYZ(3, tipX, yBot, tipZ);
  pos.setXYZ(4, b1X, yBot, b1Z);
  pos.setXYZ(5, b2X, yBot, b2Z);
  pos.needsUpdate = true;
};

const updateTail = (mesh: Mesh, headAngle: number, dirMult: number) => {
  const pos = mesh.geometry.getAttribute('position') as BufferAttribute;

  for (let i = 0; i < TAIL_SAMPLES; i++) {
    // Sample from tail end (i=0) to head (i=TAIL_SAMPLES-1)
    const a = headAngle - dirMult * (TAIL_SAMPLES - 1 - i) * TAIL_STEP;
    const cx = Math.cos(a) * ORBIT_RADIUS;
    const cz = Math.sin(a) * ORBIT_RADIUS;
    // Tangent
    const tx = -Math.sin(a);
    const tz = Math.cos(a);
    // Taper: 0 at tail, 1 at head
    const taper = i / (TAIL_SAMPLES - 1);
    const hw = TAIL_HALF_WIDTH * taper;
    const hh = TAIL_HALF_HEIGHT * taper;
    // Perpendicular to tangent (radial outward)
    const px = tz * dirMult * hw;
    const pz = -tx * dirMult * hw;
    const yTop = ORBIT_Y + hh;
    const yBot = ORBIT_Y - hh;

    const v = i * VERTS_PER_SAMPLE;
    pos.setXYZ(v, cx + px, yTop, cz + pz);
    pos.setXYZ(v + 1, cx - px, yTop, cz - pz);
    pos.setXYZ(v + 2, cx + px, yBot, cz + pz);
    pos.setXYZ(v + 3, cx - px, yBot, cz - pz);
  }
  pos.needsUpdate = true;
};

export const useOrbitAnimation = ({
  arrow1Ref,
  tail1Ref,
  arrow2Ref,
  tail2Ref,
  direction,
  colorR,
  colorG,
  colorB,
  reducedMotion,
}: UseOrbitAnimationArgs) => {
  const angleRef = useRef(0);

  useFrame((_, delta) => {
    const a1 = arrow1Ref.current;
    const t1 = tail1Ref.current;
    const a2 = arrow2Ref.current;
    const t2 = tail2Ref.current;
    if (!a1 || !t1 || !a2 || !t2) return;

    if (!reducedMotion) {
      const dirMult = direction === 'clockwise' ? -1 : 1;
      angleRef.current += dirMult * ORBIT_SPEED * delta;
    }

    const dirMult = direction === 'clockwise' ? -1 : 1;
    updateArrow(a1, angleRef.current, dirMult);
    updateTail(t1, angleRef.current, dirMult);
    updateArrow(a2, angleRef.current + Math.PI, dirMult);
    updateTail(t2, angleRef.current + Math.PI, dirMult);

    const r = colorR.get() * GLOW_INTENSITY;
    const g = colorG.get() * GLOW_INTENSITY;
    const b = colorB.get() * GLOW_INTENSITY;
    (a1.material as MeshBasicMaterial).color.setRGB(r, g, b);
    (t1.material as MeshBasicMaterial).color.setRGB(r, g, b);
    (a2.material as MeshBasicMaterial).color.setRGB(r, g, b);
    (t2.material as MeshBasicMaterial).color.setRGB(r, g, b);
  });
};
