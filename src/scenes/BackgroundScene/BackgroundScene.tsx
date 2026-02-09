import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useAppSelector } from '@/store/hooks';
import { selectEnvironment } from '@/store/slices/theme';
import { selectSnapshot } from '@/store/slices/game';
import { SceneEnvironment } from '@/components/three/SceneEnvironment';
import { Table, TABLE_SURFACE_Y } from '@/components/three/Table';
import { PlayerLabel } from '@/components/three/PlayerLabel/PlayerLabel';
import { DirectionOrbit } from '@/components/three/DirectionOrbit';
import {
  SEATS,
  SEAT_ORDER,
  unoColorToHex,
} from '@/constants';

/** Isolated environment layer — subscribes to Redux inside Canvas so
 *  environment changes don't re-render the rest of BackgroundScene. */
const EnvironmentLayer = () => {
  const preset = useAppSelector(selectEnvironment);
  return (
    <Suspense fallback={null}>
      <SceneEnvironment preset={preset} />
    </Suspense>
  );
};

type BackgroundSceneProps = {
  showTable?: boolean;
  onStartGame?: () => void;
};

export const BackgroundScene = ({
  showTable = false,
  onStartGame,
}: BackgroundSceneProps) => {
  const snapshot = useAppSelector(selectSnapshot);

  // Initialize game eagerly so the deck rides in with the table
  useEffect(() => {
    if (showTable) onStartGame?.();
  }, [showTable, onStartGame]);

  const topDiscard = snapshot?.discardPile[snapshot.discardPile.length - 1];
  const activeColorHex = unoColorToHex(topDiscard?.color);

  return (
    <div className="fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 1.8, 2.6], fov: 80 }}>
        <EnvironmentLayer />
        <pointLight position={[0, 0, 3]} intensity={0.5} />
        {showTable && (
          <Suspense fallback={null}>
            <Table>
              {snapshot && (
                <>
                  {snapshot.players.map((player, i) => (
                    <PlayerLabel
                      key={`label-${player.name}`}
                      name={player.name}
                      seat={SEATS[SEAT_ORDER[i]]}
                      surfaceY={TABLE_SURFACE_Y}
                      isActive={player.name === snapshot.currentPlayerName}
                      activeColor={activeColorHex}
                      turnId={snapshot.discardPile.length}
                    />
                  ))}
                  <DirectionOrbit
                    direction={snapshot.direction}
                    activeColor={topDiscard?.color}
                  />
                </>
              )}
            </Table>
          </Suspense>
        )}
        <OrbitControls target={[0, -0.3, 0]} enablePan={true} enableZoom={true} enabled={true} />
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.9}
            luminanceSmoothing={0.4}
            intensity={1.2}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
