import { Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useControls } from 'leva';
import { Value, Color } from 'uno-engine';
import { useAppSelector } from '@/store/hooks';
import { selectEnvironment } from '@/store/slices/theme';
import { SceneEnvironment } from '@/components/three/SceneEnvironment';
import { Table } from '@/components/three/Table';
import { Card3D } from '@/components/three/Card3D';
import type { PerspectiveCamera } from 'three';

const CameraRig = ({ position, fov }: { position: [number, number, number]; fov: number }) => {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  camera.position.set(...position);
  camera.fov = fov;
  camera.updateProjectionMatrix();
  return null;
};

type BackgroundSceneProps = {
  showTable?: boolean;
};

export const BackgroundScene = ({
  showTable = false,
}: BackgroundSceneProps) => {
  const preset = useAppSelector(selectEnvironment);

  const { intensity, lightX, lightY, lightZ } = useControls('Lighting', {
    intensity: { value: 0.5, min: 0, max: 3, step: 0.01 },
    lightX: { value: 0, min: -10, max: 10, step: 0.1 },
    lightY: { value: 0, min: -10, max: 10, step: 0.1 },
    lightZ: { value: 3, min: -10, max: 10, step: 0.1 },
  });

  const { camX, camY, camZ, targetX, targetY, targetZ, fov } = useControls('Camera', {
    camX: { value: 0, min: -10, max: 10, step: 0.1 },
    camY: { value: 1.1, min: -10, max: 10, step: 0.1 },
    camZ: { value: 3, min: -10, max: 10, step: 0.1 },
    targetX: { value: 0, min: -10, max: 10, step: 0.1 },
    targetY: { value: -0.5, min: -10, max: 10, step: 0.1 },
    targetZ: { value: 0, min: -10, max: 10, step: 0.1 },
    fov: { value: 60, min: 10, max: 120, step: 1 },
  });

  return (
    <div className="fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <CameraRig position={[camX, camY, camZ]} fov={fov} />
        <SceneEnvironment preset={preset} />
        <pointLight
          position={[lightX, lightY, lightZ]}
          intensity={intensity}
        />
        {showTable && (
          <>
            <Table />
            <Suspense fallback={null}>
              <Card3D
                value={Value.SEVEN}
                color={Color.RED}
              />
            </Suspense>
          </>
        )}
        <OrbitControls target={[targetX, targetY, targetZ]} enablePan={false} enableZoom={false} />
      </Canvas>
    </div>
  );
};
