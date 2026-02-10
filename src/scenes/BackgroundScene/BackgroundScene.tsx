import { Suspense, useCallback, useEffect, useState } from 'react';
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

type BackgroundSceneProps = {
  showTable?: boolean;
  onStartGame?: () => void;
  onPlayCard?: (cardId: string, chosenColor?: import('uno-engine').Color) => void;
};

export const BackgroundScene = ({
  showTable = false,
  onStartGame,
  onPlayCard,
}: BackgroundSceneProps) => {
  const snapshot = useAppSelector(selectSnapshot);
  const [tableReady, setTableReady] = useState(false);
  const handleTableReady = useCallback(() => setTableReady(true), []);
  const magnet = useMagnetState(snapshot, tableReady);

  useEffect(() => {
    if (showTable) onStartGame?.();
  }, [showTable, onStartGame]);

  const topDiscard = snapshot?.discardPile[snapshot.discardPile.length - 1];
  const isVisitorTurn = magnet.phase === 'playing'
    && snapshot?.currentPlayerName === snapshot?.players[0]?.name;

  const handleCardClick = useCallback((cardId: string) => {
    if (!snapshot || !onPlayCard) return;
    const card = snapshot.players[0]?.hand.find((c) => c.id === cardId);
    if (!card) return;
    const isWild = card.color == null;
    if (isWild) {
      // TODO: wild color picker
      onPlayCard(cardId);
    } else {
      onPlayCard(cardId);
    }
  }, [snapshot, onPlayCard]);

  return (
    <div className="fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 1.8, 2.6], fov: 80 }}>
        <color attach="background" args={['#000000']} />
        <SceneEnvironment />
        <pointLight position={[0, 0, 3]} intensity={0.5} />
        {showTable && (
          <Suspense fallback={null}>
            <Table onReady={handleTableReady}>
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
                playableCardIds={isVisitorTurn ? snapshot?.playableCardIds : undefined}
                onCardClick={isVisitorTurn ? handleCardClick : undefined}
              />
              {snapshot && magnet.phase === 'playing' && (
                <>
                  {snapshot.players.map((player, i) => {
                    const isVisitor = i === 0;
                    return (
                      <PlayerLabel
                        key={`label-${player.name}`}
                        name={player.name}
                        seat={SEATS[SEAT_ORDER[i]]}
                        surfaceY={TABLE_SURFACE_Y}
                        isActive={player.name === snapshot.currentPlayerName}
                        activeColor={unoColorToHex(topDiscard?.color)}
                        turnId={snapshot.discardPile.length}
                        faceCenter={isVisitor}
                        offsetY={isVisitor ? -0.1 : undefined}
                        extraPull={isVisitor ? 0.4 : undefined}
                        tiltX={isVisitor ? -0.65 : undefined}
                      />
                    );
                  })}
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
