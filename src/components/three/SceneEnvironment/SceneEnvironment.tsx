import { Environment } from '@react-three/drei';
import type { EnvironmentPreset } from '@/store/slices/theme';

type SceneEnvironmentProps = {
  preset: EnvironmentPreset;
};

export const SceneEnvironment = ({ preset }: SceneEnvironmentProps) => {
  return (
    <Environment
      preset={preset}
      background
      backgroundBlurriness={0}
      backgroundIntensity={1}
      environmentIntensity={1}
    />
  );
};
