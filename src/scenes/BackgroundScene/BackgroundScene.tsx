import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
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
import { DeckArrow } from '@/components/three/DeckArrow';
import { VisibleCardLayer } from '@/components/three/VisibleCardLayer';
import { PlayerLabel } from '@/components/three/PlayerLabel/PlayerLabel';
import type { Toast } from '@/components/three/PlayerLabel/PlayerLabel';
import { useMagnetState } from '@/hooks/useMagnetState';
import { TABLE_SURFACE_Y } from '@/components/three/Table';
import type { DialogueBubble } from '@/types/dialogue';
import { SEATS, SEAT_ORDER, unoColorToHex } from '@/constants';
import { toDisplayName } from '@/constants/players';
import { useTranslation } from '@/hooks/useTranslation';
import {
  DEBUG_MAGNETS,
  EFFECT_VALUES,
  DIALOGUE_ALIGN,
  GAME_ACTIVE_PHASES,
  DEFAULT_CAMERA_POSITION,
  DEFAULT_CAMERA_TARGET,
  DEFAULT_CAMERA_FOV,
  CAMERA_RESET_SPEED,
  CAMERA_FOCUS_SPEED,
} from './BackgroundScene.constants';

/** Compute the responsive FOV for the current canvas width. */
const responsiveFov = (width: number) =>
  width >= 1024 ? 70 : width >= 768 ? 80 : 90;

/** Adjust camera FOV based on canvas width for responsive framing. */
const ResponsiveFov = () => {
  const { camera, size } = useThree();
  useEffect(() => {
    (camera as PerspectiveCamera).fov = responsiveFov(size.width);
    camera.updateProjectionMatrix();
  }, [camera, size.width]);
  return null;
};

/**
 * Unified camera controller:
 * - Resets position + lookAt when freeLook toggles off
 * - Auto-focuses lookAt on active player's seat when freeLook is off
 */
const _defaultPos = new Vector3(...DEFAULT_CAMERA_POSITION);
const _desiredLook = new Vector3(...DEFAULT_CAMERA_TARGET);
const _currentLook = new Vector3();

const CameraController = ({
  freeLook,
  activePlayerIndex,
}: {
  freeLook: boolean;
  activePlayerIndex: number | null;
}) => {
  const { camera } = useThree();
  const resetRef = useRef(false);
  const prevFreeLookRef = useRef(freeLook);

  // Trigger position reset when freeLook toggles off
  useEffect(() => {
    const was = prevFreeLookRef.current;
    prevFreeLookRef.current = freeLook;
    if (was && !freeLook) resetRef.current = true;
  }, [freeLook]);

  // Update desired lookAt target when active player changes
  useEffect(() => {
    if (freeLook) return;
    if (activePlayerIndex == null || activePlayerIndex === 0) {
      _desiredLook.set(...DEFAULT_CAMERA_TARGET);
    } else {
      const seat = SEATS[SEAT_ORDER[activePlayerIndex]];
      if (seat) _desiredLook.set(...seat.cameraTarget);
    }
  }, [activePlayerIndex, freeLook]);

  useFrame((_, delta) => {
    if (freeLook) return;

    // Position reset (after freeLook toggle-off)
    if (resetRef.current) {
      const alpha = 1 - Math.exp(-CAMERA_RESET_SPEED * delta);
      camera.position.lerp(_defaultPos, alpha);
      if (camera.position.distanceTo(_defaultPos) < 0.001) {
        camera.position.copy(_defaultPos);
        resetRef.current = false;
      }
    }

    // LookAt focus — always lerp toward desired target
    camera.getWorldDirection(_currentLook);
    _currentLook.multiplyScalar(2).add(camera.position);
    const focusAlpha = 1 - Math.exp(-CAMERA_FOCUS_SPEED * delta);
    _currentLook.lerp(_desiredLook, focusAlpha);
    camera.lookAt(_currentLook);
  });

  return null;
};

type BackgroundSceneProps = {
  showTable?: boolean;
  onStartGame?: () => void;
  onPlayCard?: (
    cardId: string,
    chosenColor?: import('uno-engine').Color,
  ) => void;
  onDrawCard?: () => void;
  onAnimationIdle?: () => void;
  onDealingComplete?: () => void;
  onWildCardPlayed?: (cardId: string) => void;
  onDrawCardClicked?: (cardId: string) => void;
  onSceneReady?: () => void;
  onChallengeReady?: () => void;
  entranceEnabled?: boolean;
  dealingEnabled?: boolean;
  deckEnabled?: boolean;
  freeLook?: boolean;
  playableOverride?: string[];
  dialogues?: (DialogueBubble | null)[];
};

export const BackgroundScene = ({
  showTable = false,
  onStartGame,
  onPlayCard,
  onDrawCard,
  onAnimationIdle,
  onDealingComplete,
  onWildCardPlayed,
  onDrawCardClicked,
  onSceneReady,
  onChallengeReady,
  entranceEnabled = true,
  dealingEnabled = true,
  deckEnabled = true,
  freeLook = false,
  playableOverride,
  dialogues,
}: BackgroundSceneProps) => {
  const snapshot = useAppSelector(selectSnapshot);
  const mode = useAppSelector(selectMode);
  const { t } = useTranslation();
  const [tableLoaded, setTableLoaded] = useState(false);
  const [tableReady, setTableReady] = useState(false);
  const [cardsReady, setCardsReady] = useState(false);
  const sceneReadyFiredRef = useRef(false);
  const handleTableLoaded = useCallback(() => setTableLoaded(true), []);
  const handleTableReady = useCallback(() => setTableReady(true), []);
  const handleCardsReady = useCallback(() => setCardsReady(true), []);

  // Assets loaded — welcome screen can exit
  useEffect(() => {
    if (tableLoaded && cardsReady && !sceneReadyFiredRef.current) {
      sceneReadyFiredRef.current = true;
      onSceneReady?.();
    }
  }, [tableLoaded, cardsReady, onSceneReady]);

  const magnet = useMagnetState(snapshot, tableReady && dealingEnabled);
  const [toasts, setToasts] = useState<(Toast | null)[]>([]);

  useEffect(() => {
    if (showTable) onStartGame?.();
  }, [showTable, onStartGame]);

  // Fire callback when animations settle back to 'playing' phase
  // + detect special card effects (skip / +2 / +4) after play animations
  const prevPhaseRef = useRef(magnet.phase);
  const dealingFiredRef = useRef(false);
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = magnet.phase;
    if (magnet.phase === 'idle') dealingFiredRef.current = false;
    if (magnet.phase === 'playing' && prev !== 'playing') {
      if (!dealingFiredRef.current) {
        dealingFiredRef.current = true;
        onDealingComplete?.();
      }
      if (prev?.startsWith('play') && snapshot) {
        const topCard = magnet.discardPile[magnet.discardPile.length - 1];
        if (topCard && EFFECT_VALUES.has(topCard.value)) {
          const message =
            topCard.value === Value.SKIP
              ? t('status.skipped')
              : topCard.value === Value.DRAW_TWO
                ? t('status.drawTwo')
                : t('status.drawFour');
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
            const affectedIdx = (((currentIdx + dirStep) % N) + N) % N;
            const color = unoColorToHex(topCard.color) ?? '#888';
            setToasts((prev) => {
              const next = Array.from({ length: N }, (_, i) => prev[i] ?? null);
              next[affectedIdx] = { message, color, key: Date.now() };
              return next;
            });
          }
        }
      }
      // Fire challenge-ready when draw-4 animation finishes and challenge is pending
      if (prev?.startsWith('draw') && snapshot?.pendingChallenge) {
        onChallengeReady?.();
      }

      onAnimationIdle?.();
    }
  }, [
    magnet.phase,
    magnet.discardPile,
    snapshot,
    onAnimationIdle,
    onDealingComplete,
    onChallengeReady,
    t,
  ]);

  // Show toast when a WD4 challenge resolves (pendingChallenge goes non-null → null)
  const challengeSnapshotRef = useRef<{
    blufferName: string;
    victimName: string;
    handSizes: number[];
  } | null>(null);
  useEffect(() => {
    if (snapshot?.pendingChallenge && !challengeSnapshotRef.current) {
      // Save baseline hand sizes when challenge appears
      challengeSnapshotRef.current = {
        blufferName: snapshot.pendingChallenge.blufferName,
        victimName: snapshot.pendingChallenge.victimName,
        handSizes: snapshot.players.map((p) => p.hand.length),
      };
    }
    if (
      !snapshot?.pendingChallenge &&
      challengeSnapshotRef.current &&
      snapshot
    ) {
      const saved = challengeSnapshotRef.current;
      challengeSnapshotRef.current = null;

      const N = snapshot.players.length;
      const blufferIdx = snapshot.players.findIndex(
        (p) => p.name === saved.blufferName,
      );
      const victimIdx = snapshot.players.findIndex(
        (p) => p.name === saved.victimName,
      );

      let message: string;
      let targetIdx: number;
      let color: string;

      if (
        blufferIdx >= 0 &&
        snapshot.players[blufferIdx].hand.length > saved.handSizes[blufferIdx]
      ) {
        // Bluffer gained cards → bluff caught
        message = t('status.bluffCaught');
        targetIdx = blufferIdx;
        color = '#ef4444';
      } else if (
        victimIdx >= 0 &&
        snapshot.players[victimIdx].hand.length > saved.handSizes[victimIdx]
      ) {
        // Victim gained extra cards → challenge failed
        message = t('status.challengeFailed');
        targetIdx = victimIdx;
        color = '#f97316';
      } else {
        // No extra draws → accepted
        message = t('status.accepted');
        targetIdx = victimIdx >= 0 ? victimIdx : 0;
        color = '#888';
      }

      setToasts((prev) => {
        const next = Array.from({ length: N }, (_, i) => prev[i] ?? null);
        next[targetIdx] = { message, color, key: Date.now() };
        return next;
      });
    }
  }, [snapshot, t]);

  // Show toast when UNO callable resolves (unoCallable goes non-null → null)
  // If a player's hand grew, they were caught and penalized.
  const unoSnapshotRef = useRef<{
    callableName: string;
    handSizes: number[];
  } | null>(null);
  useEffect(() => {
    if (snapshot?.unoCallable && !unoSnapshotRef.current) {
      unoSnapshotRef.current = {
        callableName: snapshot.unoCallable.playerName,
        handSizes: snapshot.players.map((p) => p.hand.length),
      };
    }
    if (!snapshot?.unoCallable && unoSnapshotRef.current && snapshot) {
      const saved = unoSnapshotRef.current;
      unoSnapshotRef.current = null;

      const N = snapshot.players.length;
      const callableIdx = snapshot.players.findIndex(
        (p) => p.name === saved.callableName,
      );

      if (
        callableIdx >= 0 &&
        snapshot.players[callableIdx].hand.length > saved.handSizes[callableIdx]
      ) {
        // Callable player's hand grew → they were caught
        setToasts((prev) => {
          const next = Array.from({ length: N }, (_, i) => prev[i] ?? null);
          next[callableIdx] = {
            message: t('status.caughtPenalty'),
            color: '#ef4444',
            key: Date.now(),
          };
          return next;
        });
      }
    }
  }, [snapshot, t]);

  // Auto-clear toasts after CSS animation finishes
  useEffect(() => {
    if (!toasts.some(Boolean)) return;
    const timer = setTimeout(
      () => setToasts((prev) => prev.map(() => null)),
      2000,
    );
    return () => clearTimeout(timer);
  }, [toasts]);

  // Use magnet state's discard pile for visual props — deferred during animations
  // so the orbit color/direction only update after the card lands.
  const topDiscard = magnet.discardPile[magnet.discardPile.length - 1];
  const visitorName = snapshot?.players[0]?.name;
  const isVisitorTurn =
    magnet.phase === 'playing' &&
    magnet.currentPlayerName === visitorName &&
    snapshot?.currentPlayerName === visitorName;

  const activePlayerIndex =
    magnet.phase === 'playing' && snapshot
      ? snapshot.players.findIndex(
          (p) =>
            p.name === magnet.currentPlayerName &&
            p.name === snapshot.currentPlayerName,
        )
      : -1;

  const handleCardClick = useCallback(
    (cardId: string) => {
      if (!snapshot) return;
      const card = snapshot.players[0]?.hand.find((c) => c.id === cardId);
      if (!card) return;
      const isWild = card.color == null;
      if (isWild) {
        onWildCardPlayed?.(cardId);
      } else {
        onPlayCard?.(cardId);
      }
    },
    [snapshot, onPlayCard, onWildCardPlayed],
  );

  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [...DEFAULT_CAMERA_POSITION], fov: DEFAULT_CAMERA_FOV }}>
        <ResponsiveFov />
        <CameraController
          freeLook={freeLook}
          activePlayerIndex={activePlayerIndex >= 0 ? activePlayerIndex : null}
        />
        <color
          attach="background"
          args={[mode === 'dark' ? '#000000' : '#e8e4df']}
        />
        <SceneEnvironment />
        <pointLight position={[0, 0, 3]} intensity={0.5} />
        {showTable && (
          <Suspense fallback={null}>
            <Table startEntrance={entranceEnabled} onLoad={handleTableLoaded} onReady={handleTableReady}>
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
              <DeckArrow
                visible={
                  isVisitorTurn && deckEnabled && !playableOverride
                }
              />
              <VisibleCardLayer
                magnet={magnet}
                playableCardIds={
                  isVisitorTurn
                    ? (playableOverride ?? snapshot?.playableCardIds)
                    : undefined
                }
                onCardClick={
                  isVisitorTurn
                    ? playableOverride
                      ? onDrawCardClicked
                      : handleCardClick
                    : undefined
                }
                onDeckClick={
                  isVisitorTurn && deckEnabled ? onDrawCard : undefined
                }
                onDeckReady={handleCardsReady}
              />
              {snapshot && GAME_ACTIVE_PHASES.has(magnet.phase) && (
                <>
                  {snapshot.players.map((player, i) => {
                    const isVisitor = i === 0;
                    return (
                      <PlayerLabel
                        key={`label-${player.name}`}
                        name={toDisplayName(player.name)}
                        cardCount={magnet.playerHands[i]?.length}
                        seat={SEATS[SEAT_ORDER[i]]}
                        surfaceY={TABLE_SURFACE_Y}
                        isActive={
                          magnet.phase === 'playing' &&
                          player.name === magnet.currentPlayerName &&
                          player.name === snapshot.currentPlayerName
                        }
                        activeColor={unoColorToHex(topDiscard?.color)}
                        faceCenter={isVisitor}
                        offsetY={isVisitor ? -0.1 : 1.2}
                        extraPull={isVisitor ? 0.4 : 0.35}
                        tiltX={isVisitor ? -0.65 : undefined}
                        toast={toasts[i] ?? null}
                        dialogue={dialogues?.[i] ?? null}
                        dialogueAlign={DIALOGUE_ALIGN[player.name]}
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
        <OrbitControls
          target={[...DEFAULT_CAMERA_TARGET]}
          enablePan={freeLook}
          enableZoom={freeLook}
          enableRotate={freeLook}
          enabled={freeLook}
        />
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
