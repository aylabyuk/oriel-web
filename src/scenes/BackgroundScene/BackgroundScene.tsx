import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useAppSelector } from '@/store/hooks';
import { selectSnapshot } from '@/store/slices/game';
import { SceneEnvironment } from '@/components/three/SceneEnvironment';
import { Table } from '@/components/three/Table';
import { DirectionOrbit } from '@/components/three/DirectionOrbit';
import {
  MagnetDeck,
  MagnetDiscardPile,
  MagnetPlayerFront,
  MagnetPlayerHand,
} from '@/components/three/MagnetZones';
import { VisibleCardLayer } from '@/components/three/VisibleCardLayer';
import { PlayerLabel } from '@/components/three/PlayerLabel/PlayerLabel';
import { useMagnetState } from '@/hooks/useMagnetState';
import { TABLE_SURFACE_Y } from '@/components/three/Table';
import {
  SEATS,
  SEAT_ORDER,
  unoColorToHex,
} from '@/constants';

/** Set to true to render the debug magnet card layer alongside visible cards. */
const DEBUG_MAGNETS = false;

/** Phases where gameplay UI (labels, direction orbit) should remain visible */
const GAME_ACTIVE_PHASES = new Set([
  'playing', 'play_gap', 'play_lift', 'play_move', 'play_rotate',
  'draw_lift', 'draw_move', 'draw_gap', 'draw_drop',
]);

type BackgroundSceneProps = {
  showTable?: boolean;
  onStartGame?: () => void;
  onPlayCard?: (cardId: string, chosenColor?: import('uno-engine').Color) => void;
  onDrawCard?: () => void;
  onAnimationIdle?: () => void;
  onWildCardPlayed?: (cardId: string) => void;
  onDrawCardClicked?: (cardId: string) => void;
  onSceneReady?: () => void;
  deckEnabled?: boolean;
  playableOverride?: string[];
};

export const BackgroundScene = ({
  showTable = false,
  onStartGame,
  onPlayCard,
  onDrawCard,
  onAnimationIdle,
  onWildCardPlayed,
  onDrawCardClicked,
  onSceneReady,
  deckEnabled = true,
  playableOverride,
}: BackgroundSceneProps) => {
  const snapshot = useAppSelector(selectSnapshot);
  const [tableReady, setTableReady] = useState(false);
  const [cardsReady, setCardsReady] = useState(false);
  const handleTableReady = useCallback(() => setTableReady(true), []);
  const handleCardsReady = useCallback(() => {
    setCardsReady(true);
    onSceneReady?.();
  }, [onSceneReady]);
  const magnet = useMagnetState(snapshot, tableReady);

  useEffect(() => {
    if (showTable) onStartGame?.();
  }, [showTable, onStartGame]);

  // Fire callback when animations settle back to 'playing' phase
  const prevPhaseRef = useRef(magnet.phase);
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = magnet.phase;
    if (magnet.phase === 'playing' && prev !== 'playing') {
      onAnimationIdle?.();
    }
  }, [magnet.phase, onAnimationIdle]);

  // Use magnet state's discard pile for visual props — deferred during animations
  // so the orbit color/direction only update after the card lands.
  const topDiscard = magnet.discardPile[magnet.discardPile.length - 1];
  const isVisitorTurn = magnet.phase === 'playing'
    && magnet.currentPlayerName === snapshot?.players[0]?.name;

  const handleCardClick = useCallback((cardId: string) => {
    if (!snapshot) return;
    const card = snapshot.players[0]?.hand.find((c) => c.id === cardId);
    if (!card) return;
    const isWild = card.color == null;
    if (isWild) {
      onWildCardPlayed?.(cardId);
    } else {
      onPlayCard?.(cardId);
    }
  }, [snapshot, onPlayCard, onWildCardPlayed]);

  return (
    <div className="fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 1.8, 2.6], fov: 80 }}>
        <color attach="background" args={['#000000']} />
        <SceneEnvironment />
        <pointLight position={[0, 0, 3]} intensity={0.5} />
        {showTable && (
          <Suspense fallback={null}>
            <Table startEntrance={cardsReady} onReady={handleTableReady}>
              {DEBUG_MAGNETS && (
                <>
                  <MagnetDeck cards={magnet.deck} />
                  <MagnetDiscardPile cards={magnet.discardPile} />
                  {magnet.playerFronts.map((cards, i) => (
                    <MagnetPlayerFront
                      key={`front-${i}`}
                      cards={cards}
                      seat={SEATS[SEAT_ORDER[i]]}
                    />
                  ))}
                  {magnet.playerHands.map((cards, i) => (
                    <MagnetPlayerHand
                      key={`hand-${i}`}
                      cards={cards}
                      seat={SEATS[SEAT_ORDER[i]]}
                    />
                  ))}
                </>
              )}
              <VisibleCardLayer
                magnet={magnet}
                playableCardIds={isVisitorTurn ? (playableOverride ?? snapshot?.playableCardIds) : undefined}
                onCardClick={isVisitorTurn ? (playableOverride ? onDrawCardClicked : handleCardClick) : undefined}
                onDeckClick={isVisitorTurn && deckEnabled ? onDrawCard : undefined}
                onDeckReady={handleCardsReady}
              />
              {snapshot && GAME_ACTIVE_PHASES.has(magnet.phase) && (
                <>
                  {snapshot.players.map((player, i) => {
                    const isVisitor = i === 0;
                    return (
                      <PlayerLabel
                        key={`label-${player.name}`}
                        name={player.name}
                        seat={SEATS[SEAT_ORDER[i]]}
                        surfaceY={TABLE_SURFACE_Y}
                        isActive={magnet.phase === 'playing' && player.name === magnet.currentPlayerName}
                        activeColor={unoColorToHex(topDiscard?.color)}
                        faceCenter={isVisitor}
                        offsetY={isVisitor ? -0.1 : undefined}
                        extraPull={isVisitor ? 0.4 : undefined}
                        tiltX={isVisitor ? -0.65 : undefined}
                      />
                    );
                  })}
                  <DirectionOrbit
                    direction={magnet.direction}
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
