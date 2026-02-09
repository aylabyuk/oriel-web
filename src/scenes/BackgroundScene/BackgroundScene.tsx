import { Suspense, useCallback, useEffect, useState } from 'react';
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
import { DirectionOrbit } from '@/components/three/DirectionOrbit';
import { CameraRig } from '@/components/three/CameraRig';
import type { Color } from 'uno-engine';
import {
  SEATS,
  SEAT_ORDER,
  DRAW_PILE_POSITION,
  DISCARD_PILE_POSITION,
  unoColorToHex,
} from '@/constants';

const CARDS_PER_PLAYER = 7;
const DEAL_STAGGER_MS = 150;
/** Base delay so dealing starts after the table spring settles */
const TABLE_SETTLE_MS = 2000;
/** Approximate duration of the initial discard flip animation */
const DISCARD_FLIP_MS = 1000;
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

  const CARD_DEPTH = 0.003;
  const playerCount = snapshot?.players.length ?? 0;
  const deckTopY =
    CARD_BASE_Y + (snapshot?.drawPile.length ?? 0) * CARD_DEPTH;
  const discardDelay = TABLE_SETTLE_MS;
  const dealStart = TABLE_SETTLE_MS + DISCARD_FLIP_MS;
  const revealDelay =
    dealStart + CARDS_PER_PLAYER * playerCount * DEAL_STAGGER_MS;
  const topDiscard = snapshot?.discardPile[snapshot.discardPile.length - 1];
  const activeColorHex = unoColorToHex(topDiscard?.color);
  const activeSeatIndex = snapshot
    ? snapshot.players.findIndex((p) => p.name === snapshot.currentPlayerName)
    : 0;
  const [readyToPlay, setReadyToPlay] = useState(false);
  const handleReady = useCallback(() => setReadyToPlay(true), []);

  return (
    <div className="fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 1.8, 2.6], fov: 60 }}>
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
                    deckTopY={deckTopY}
                    dealDelay={discardDelay}
                  />
                  {snapshot.players.map((player, i) => (
                    <PlayerHand
                      key={player.name}
                      cards={player.hand}
                      seat={SEATS[SEAT_ORDER[i]]}
                      seatIndex={i}
                      playerCount={playerCount}
                      faceUp={i === 0}
                      surfaceY={CARD_BASE_Y}
                      deckTopY={deckTopY}
                      dealBaseDelay={dealStart}
                      revealDelay={revealDelay}
                      isActive={player.name === snapshot.currentPlayerName}
                      glowColor={activeColorHex}
                      playableCardIds={i === 0 ? snapshot.playableCardIds : undefined}
                      onReady={i === 0 ? handleReady : undefined}
                      onPlayCard={i === 0 ? onPlayCard : undefined}
                    />
                  ))}
                  {readyToPlay && (
                    <DirectionOrbit
                      direction={snapshot.direction}
                      activeColor={topDiscard?.color}
                    />
                  )}
                </>
              )}
            </Table>
          </Suspense>
        )}
        {!import.meta.env.DEV && readyToPlay && <CameraRig activeSeatIndex={activeSeatIndex} />}
        <OrbitControls target={[0, -0.3, 0]} enablePan={false} enableZoom={false} enabled={import.meta.env.DEV || !readyToPlay} />
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
