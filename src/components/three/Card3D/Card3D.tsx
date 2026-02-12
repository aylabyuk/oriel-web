import { memo, type RefObject } from 'react';
import { useTexture } from '@react-three/drei';
import type { Mesh } from 'three';
import type { Value, Color } from 'uno-engine';
import { getCardFilename } from '@/utils/cardTexture';
import { CARD_TEXTURES, CARD_BACK_TEXTURE } from '@/constants';
import { FACE_OFFSET, bodyGeo, faceGeo } from './Card3D.constants';

// Preload every card texture so useTexture never suspends at render time.
for (const url of Object.values(CARD_TEXTURES)) {
  useTexture.preload(url);
}

type Card3DProps = {
  value?: Value;
  color?: Color;
  faceUp?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  glowColor?: string;
  glowIntensity?: number;
  /** Ref to the body mesh — allows external animation of material properties */
  bodyRef?: RefObject<Mesh | null>;
};

export const Card3D = memo(
  ({
    value,
    color,
    faceUp = true,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    glowColor,
    glowIntensity = 0,
    bodyRef,
  }: Card3DProps) => {
    const showFront = faceUp && value !== undefined;
    const frontUrl = showFront
      ? CARD_TEXTURES[getCardFilename(value, color)]
      : undefined;

    const textures = useTexture(
      frontUrl ? [frontUrl, CARD_BACK_TEXTURE] : [CARD_BACK_TEXTURE],
    );

    const [frontTex, backTex] = frontUrl ? textures : [undefined, textures[0]];

    return (
      <group position={position} rotation={rotation}>
        <mesh ref={bodyRef} geometry={bodyGeo}>
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.5}
            emissive={glowColor ?? '#000000'}
            emissiveIntensity={glowIntensity}
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
  },
);
