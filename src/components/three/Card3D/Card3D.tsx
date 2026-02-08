import { useTexture } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { Shape, ShapeGeometry, ExtrudeGeometry } from 'three';
import type { Value, Color } from 'uno-engine';
import { getCardFilename } from '@/utils/cardTexture';
import { CARD_TEXTURES, CARD_BACK_TEXTURE } from '@/constants';

const CARD_WIDTH = 0.7;
const CARD_HEIGHT = 1.0;
const CARD_DEPTH = 0.003;
const CARD_RADIUS = 0.04;
const FACE_OFFSET = CARD_DEPTH / 2 + 0.001;

function createRoundedRectShape(w: number, h: number, r: number) {
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
}

const cardShape = createRoundedRectShape(CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);

const bodyGeo = new ExtrudeGeometry(cardShape, {
  depth: CARD_DEPTH,
  bevelEnabled: false,
});
bodyGeo.translate(0, 0, -CARD_DEPTH / 2);

const faceGeo = (() => {
  const geo = new ShapeGeometry(cardShape);
  const uvAttr = geo.attributes.uv;
  const posAttr = geo.attributes.position;
  for (let i = 0; i < uvAttr.count; i++) {
    uvAttr.setXY(
      i,
      (posAttr.getX(i) + CARD_WIDTH / 2) / CARD_WIDTH,
      (posAttr.getY(i) + CARD_HEIGHT / 2) / CARD_HEIGHT,
    );
  }
  uvAttr.needsUpdate = true;
  return geo;
})();

type Card3DProps = {
  value?: Value;
  color?: Color;
  faceUp?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  glowColor?: string;
  glowIntensity?: number;
};

export const Card3D = ({
  value,
  color,
  faceUp = true,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  glowColor,
  glowIntensity = 0,
}: Card3DProps) => {
  const showFront = faceUp && value !== undefined;
  const frontUrl = showFront
    ? CARD_TEXTURES[getCardFilename(value, color)]
    : undefined;

  const textures = useTexture(
    frontUrl ? [frontUrl, CARD_BACK_TEXTURE] : [CARD_BACK_TEXTURE],
  );

  const [frontTex, backTex] = frontUrl
    ? textures
    : [undefined, textures[0]];

  const { intensity } = useSpring({
    intensity: glowIntensity,
    config: { tension: 120, friction: 14 },
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={bodyGeo}>
        <animated.meshStandardMaterial
          color="#ffffff"
          roughness={0.5}
          emissive={glowColor ?? '#000000'}
          emissiveIntensity={intensity}
          toneMapped={false}
        />
      </mesh>

      {frontTex && (
        <mesh geometry={faceGeo} position={[0, 0, FACE_OFFSET]}>
          <meshStandardMaterial map={frontTex} transparent />
        </mesh>
      )}

      <mesh
        geometry={faceGeo}
        position={[0, 0, -FACE_OFFSET]}
        rotation={[0, Math.PI, 0]}
      >
        <meshStandardMaterial map={backTex} transparent />
      </mesh>
    </group>
  );
};
