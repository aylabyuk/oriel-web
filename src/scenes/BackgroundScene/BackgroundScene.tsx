import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useAppSelector } from '@/store/hooks';
import { selectEnvironment } from '@/store/slices/theme';
import { selectSnapshot } from '@/store/slices/game';
import { SceneEnvironment } from '@/components/three/SceneEnvironment';
import { Table, TABLE_SURFACE_Y } from '@/components/three/Table';
import { CardDeck } from '@/components/three/CardDeck';
import { DiscardPile } from '@/components/three/DiscardPile';
import { PlayerHand } from '@/components/three/PlayerHand';
import { PlayerLabel } from '@/components/three/PlayerLabel/PlayerLabel';
import { DirectionOrbit } from '@/components/three/DirectionOrbit';
import { CARD_HALF_HEIGHT, CAMERA_LIFT_Y, CAMERA_TILT_X } from '@/components/three/PlayerHand/constants';
import type { Color } from 'uno-engine';
import {
  SEATS,
  SEAT_ORDER,
  DRAW_PILE_POSITION,
  DISCARD_PILE_POSITION,
  unoColorToHex,
} from '@/constants';

/** Small Y offset above table surface to prevent z-fighting */
const CARD_BASE_Y = TABLE_SURFACE_Y + 0.02;

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
  onPlayCard?: (cardId: string, chosenColor?: Color) => void;
};

export const BackgroundScene = ({
  showTable = false,
  onStartGame,
  onPlayCard,
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
                  <CardDeck
                    cards={snapshot.drawPile}
                    position={[
                      DRAW_PILE_POSITION[0],
                      CARD_BASE_Y,
                      DRAW_PILE_POSITION[2],
                    ]}
                  />
                  <DiscardPile
                    cards={snapshot.discardPile}
                    position={[
                      DISCARD_PILE_POSITION[0],
                      CARD_BASE_Y,
                      DISCARD_PILE_POSITION[2],
                    ]}
                  />
                  {snapshot.players.map((player, i) => (
                    <PlayerHand
                      key={player.name}
                      cards={player.hand}
                      seat={SEATS[SEAT_ORDER[i]]}
                      faceUp
                      isHuman={i === 0}
                      surfaceY={CARD_BASE_Y}
                      isActive={i === 0 && player.name === snapshot.currentPlayerName}
                      glowColor={i === 0 ? activeColorHex : undefined}
                      playableCardIds={i === 0 ? snapshot.playableCardIds : undefined}
                      onPlayCard={i === 0 ? onPlayCard : undefined}
                    />
                  ))}
                  {snapshot.players.map((player, i) => (
                    <PlayerLabel
                      key={`label-${player.name}`}
                      name={player.name}
                      seat={SEATS[SEAT_ORDER[i]]}
                      surfaceY={CARD_BASE_Y}
                      offsetY={i === 0
                        ? CAMERA_LIFT_Y - CARD_HALF_HEIGHT
                        : undefined}
                      extraPull={i === 0 ? 0.5 : undefined}
                      faceCenter={i === 0}
                      tiltX={i === 0 ? CAMERA_TILT_X : undefined}
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
