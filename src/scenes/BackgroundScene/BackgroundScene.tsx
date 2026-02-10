import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useAppSelector } from '@/store/hooks';
import { selectSnapshot } from '@/store/slices/game';
import { selectMode } from '@/store/slices/theme';
import { SceneEnvironment } from '@/components/three/SceneEnvironment';
import { Table } from '@/components/three/Table';
import { DirectionOrbit } from '@/components/three/DirectionOrbit';
import {
  MagnetDeck,
  MagnetDiscardPile,
  MagnetPlayerFront,
  MagnetPlayerHand,
} from '@/components/three/MagnetZones';
import { Value } from 'uno-engine';
import { VisibleCardLayer } from '@/components/three/VisibleCardLayer';
import { PlayerLabel } from '@/components/three/PlayerLabel/PlayerLabel';
import type { Toast } from '@/components/three/PlayerLabel/PlayerLabel';
import { useMagnetState } from '@/hooks/useMagnetState';
import { TABLE_SURFACE_Y } from '@/components/three/Table';
import {
  SEATS,
  SEAT_ORDER,
  unoColorToHex,
} from '@/constants';

/** Adjust camera FOV based on canvas width for responsive framing. */
const ResponsiveFov = () => {
  const { camera, size } = useThree();
  useEffect(() => {
    const w = size.width;
    const fov = w >= 1024 ? 70 : w >= 768 ? 80 : 90;
    (camera as PerspectiveCamera).fov = fov;
    camera.updateProjectionMatrix();
  }, [camera, size.width]);
  return null;
};

/** Set to true to render the debug magnet card layer alongside visible cards. */
const DEBUG_MAGNETS = false;

const getEffectMessage = (value: Value): string | null => {
  switch (value) {
    case Value.SKIP: return 'Skipped!';
    case Value.DRAW_TWO: return 'Draw 2!';
    case Value.WILD_DRAW_FOUR: return 'Draw 4!';
    default: return null;
  }
};

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
  const mode = useAppSelector(selectMode);
  const [tableReady, setTableReady] = useState(false);
  const [cardsReady, setCardsReady] = useState(false);
  const handleTableReady = useCallback(() => setTableReady(true), []);
  const handleCardsReady = useCallback(() => {
    setCardsReady(true);
    onSceneReady?.();
  }, [onSceneReady]);
  const magnet = useMagnetState(snapshot, tableReady);
  const [toasts, setToasts] = useState<(Toast | null)[]>([]);

  useEffect(() => {
    if (showTable) onStartGame?.();
  }, [showTable, onStartGame]);

  // Fire callback when animations settle back to 'playing' phase
  // + detect special card effects (skip / +2 / +4) after play animations
  const prevPhaseRef = useRef(magnet.phase);
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = magnet.phase;
    if (magnet.phase === 'playing' && prev !== 'playing') {
      if (prev?.startsWith('play') && snapshot) {
        const topCard = magnet.discardPile[magnet.discardPile.length - 1];
        if (topCard) {
          const message = getEffectMessage(topCard.value);
          if (message) {
            const N = snapshot.players.length;
            // snapshot.currentPlayerName is the player AFTER the skip/draw
            // so the affected player is one step backward in the play direction.
            // Use snapshot values (always current) instead of magnet values
            // which can be stale when animations chain back-to-back.
            const currentIdx = snapshot.players.findIndex(
              (p) => p.name === snapshot.currentPlayerName,
            );
            if (currentIdx >= 0) {
              const dirStep = snapshot.direction === 'clockwise' ? -1 : 1;
              const affectedIdx = ((currentIdx + dirStep) % N + N) % N;
              const color = unoColorToHex(topCard.color) ?? '#888';
              setToasts((prev) => {
                const next = Array.from({ length: N }, (_, i) => prev[i] ?? null);
                next[affectedIdx] = { message, color, key: Date.now() };
                return next;
              });
            }
          }
        }
      }
      onAnimationIdle?.();
    }
  }, [magnet.phase, magnet.discardPile, snapshot, onAnimationIdle]);

  // Auto-clear toasts after CSS animation finishes
  useEffect(() => {
    if (!toasts.some(Boolean)) return;
    const timer = setTimeout(() => setToasts((prev) => prev.map(() => null)), 2000);
    return () => clearTimeout(timer);
  }, [toasts]);

  // Use magnet state's discard pile for visual props — deferred during animations
  // so the orbit color/direction only update after the card lands.
  const topDiscard = magnet.discardPile[magnet.discardPile.length - 1];
  const visitorName = snapshot?.players[0]?.name;
  const isVisitorTurn = magnet.phase === 'playing'
    && magnet.currentPlayerName === visitorName
    && snapshot?.currentPlayerName === visitorName;

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
        <ResponsiveFov />
        <color attach="background" args={[mode === 'dark' ? '#000000' : '#e8e4df']} />
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
                        cardCount={magnet.playerHands[i]?.length}
                        seat={SEATS[SEAT_ORDER[i]]}
                        surfaceY={TABLE_SURFACE_Y}
                        isActive={magnet.phase === 'playing' && player.name === magnet.currentPlayerName && player.name === snapshot.currentPlayerName}
                        activeColor={unoColorToHex(topDiscard?.color)}
                        faceCenter={isVisitor}
                        offsetY={isVisitor ? -0.1 : undefined}
                        extraPull={isVisitor ? 0.4 : 0.35}
                        tiltX={isVisitor ? -0.65 : undefined}
                        toast={toasts[i] ?? null}
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
            luminanceThreshold={mode === 'dark' ? 0.9 : 1.2}
            luminanceSmoothing={0.4}
            intensity={mode === 'dark' ? 1.2 : 0.4}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
