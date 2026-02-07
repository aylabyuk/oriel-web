import { Canvas } from '@react-three/fiber';
import { SceneEnvironment } from '@/components/three/SceneEnvironment';

type BackgroundSceneProps = {
  mode: 'light' | 'dark';
};

export const BackgroundScene = ({ mode }: BackgroundSceneProps) => (
  <div className="pointer-events-none fixed inset-0 z-0">
    <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
      <SceneEnvironment mode={mode} />
    </Canvas>
  </div>
);
