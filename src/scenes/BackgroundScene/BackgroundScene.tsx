import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useControls } from 'leva';
import { Value, Color } from 'uno-engine';
import { SceneEnvironment } from '@/components/three/SceneEnvironment';
import { Table } from '@/components/three/Table';
import { Card3D } from '@/components/three/Card3D';

type BackgroundSceneProps = {
  mode: 'light' | 'dark';
  showTable?: boolean;
};

export const BackgroundScene = ({
  mode,
  showTable = false,
}: BackgroundSceneProps) => {
  const { posX, posY, posZ, rotX, rotY, rotZ, faceUp } = useControls(
    'Card3D',
    {
      posX: { value: 0, min: -5, max: 5, step: 0.01 },
      posY: { value: -0.944, min: -5, max: 5, step: 0.001 },
      posZ: { value: -2, min: -10, max: 10, step: 0.1 },
      rotX: { value: -Math.PI / 2, min: -Math.PI, max: Math.PI, step: 0.01 },
      rotY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
      rotZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
      faceUp: true,
    },
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 4, 6], fov: 50 }}>
        <SceneEnvironment mode={mode} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        {showTable && (
          <>
            <Table />
            <Suspense fallback={null}>
              <Card3D
                value={Value.SEVEN}
                color={Color.RED}
                faceUp={faceUp}
                position={[posX, posY, posZ]}
                rotation={[rotX, rotY, rotZ]}
              />
            </Suspense>
          </>
        )}
      </Canvas>
    </div>
  );
};
