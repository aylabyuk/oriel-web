import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Value, Color } from 'uno-engine';
import { useAppSelector } from '@/store/hooks';
import { selectEnvironment } from '@/store/slices/theme';
import { SceneEnvironment } from '@/components/three/SceneEnvironment';
import { Table } from '@/components/three/Table';
import { Card3D } from '@/components/three/Card3D';

type BackgroundSceneProps = {
  showTable?: boolean;
};

export const BackgroundScene = ({
  showTable = false,
}: BackgroundSceneProps) => {
  const preset = useAppSelector(selectEnvironment);

  return (
    <div className="fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 1.1, 3], fov: 60 }}>
        <SceneEnvironment preset={preset} />
        <pointLight position={[0, 0, 3]} intensity={0.5} />
        {showTable && (
          <Suspense fallback={null}>
            <Table />
            <Card3D
              value={Value.SEVEN}
              color={Color.RED}
            />
          </Suspense>
        )}
        <OrbitControls target={[0, -0.5, 0]} enablePan={false} enableZoom={false} />
      </Canvas>
    </div>
  );
};
