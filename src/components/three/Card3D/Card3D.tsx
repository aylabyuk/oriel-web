import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { MeshStandardMaterial } from 'three';
import type { Value, Color } from 'uno-engine';
import { getCardFilename } from '@/utils/cardTexture';
import { CARD_TEXTURES, CARD_BACK_TEXTURE } from '@/constants';

const CARD_WIDTH = 0.7;
const CARD_HEIGHT = 1.0;
const CARD_DEPTH = 0.01;

type Card3DProps = {
  value: Value;
  color?: Color;
  faceUp?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
};

export const Card3D = ({
  value,
  color,
  faceUp = true,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: Card3DProps) => {
  const filename = getCardFilename(value, color);
  const frontUrl = CARD_TEXTURES[filename];

  const textures = useTexture(
    faceUp ? [frontUrl, CARD_BACK_TEXTURE] : [CARD_BACK_TEXTURE],
  );

  const materials = useMemo(() => {
    const edge = new MeshStandardMaterial({ visible: false });

    if (faceUp) {
      const [frontTex, backTex] = textures;
      const front = new MeshStandardMaterial({ map: frontTex, transparent: true });
      const back = new MeshStandardMaterial({ map: backTex, transparent: true });
      return [edge, edge, edge, edge, front, back];
    }

    const [backTex] = textures;
    const back = new MeshStandardMaterial({ map: backTex, transparent: true });
    return [edge, edge, edge, edge, back, back];
  }, [textures, faceUp]);

  return (
    <mesh position={position} rotation={rotation} material={materials}>
      <boxGeometry args={[CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH]} />
    </mesh>
  );
};
