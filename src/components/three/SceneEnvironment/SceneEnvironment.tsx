import { Stars, Sky, Environment } from '@react-three/drei';

type SceneEnvironmentProps = {
  mode: 'light' | 'dark';
};

export const SceneEnvironment = ({ mode }: SceneEnvironmentProps) => {
  const isDark = mode === 'dark';

  return (
    <>
      {isDark && (
        <Stars radius={100} depth={50} count={5000} fade factor={4} />
      )}
      {!isDark && (
        <Sky
          sunPosition={[1, 0.15, 0]}
          turbidity={10}
          rayleigh={3}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
      )}
      <Environment preset={isDark ? 'night' : 'dawn'} background={false} />
    </>
  );
};
