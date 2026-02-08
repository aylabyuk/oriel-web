import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useAppSelector } from '@/store/hooks';
import { selectEnvironment } from '@/store/slices/theme';
import { SceneEnvironment } from '@/components/three/SceneEnvironment';
import { Table, TABLE_SURFACE_Y } from '@/components/three/Table';
import { CardDeck } from '@/components/three/CardDeck';

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
            <Table>
              <CardDeck position={[-1.2, TABLE_SURFACE_Y, -1]} rotation={[0, 0.15, 0]} />
            </Table>
          </Suspense>
        )}
        <OrbitControls target={[0, -0.5, 0]} enablePan={false} enableZoom={false} />
      </Canvas>
    </div>
  );
};
