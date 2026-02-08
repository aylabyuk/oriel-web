import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useAppSelector } from '@/store/hooks';
import { selectEnvironment } from '@/store/slices/theme';
import { selectSnapshot } from '@/store/slices/game';
import { SceneEnvironment } from '@/components/three/SceneEnvironment';
import { Table, TABLE_SURFACE_Y } from '@/components/three/Table';
import { CardDeck } from '@/components/three/CardDeck';
import { DiscardPile } from '@/components/three/DiscardPile';
import { PlayerHand } from '@/components/three/PlayerHand';
import {
  SEATS,
  SEAT_ORDER,
  DRAW_PILE_POSITION,
  DISCARD_PILE_POSITION,
} from '@/constants';

const CARDS_PER_PLAYER = 7;
const DEAL_STAGGER_MS = 150;
/** Base delay so dealing starts after the table spring settles */
const TABLE_SETTLE_MS = 2000;
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

  const CARD_DEPTH = 0.003;
  const playerCount = snapshot?.players.length ?? 0;
  const deckTopY =
    CARD_BASE_Y + (snapshot?.drawPileCount ?? 0) * CARD_DEPTH;
  const discardDelay =
    TABLE_SETTLE_MS + CARDS_PER_PLAYER * playerCount * DEAL_STAGGER_MS;

  return (
    <div className="fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 1.1, 3], fov: 60 }}>
        <EnvironmentLayer />
        <pointLight position={[0, 0, 3]} intensity={0.5} />
        {showTable && (
          <Suspense fallback={null}>
            <Table>
              {snapshot && (
                <>
                  <CardDeck
                    count={snapshot.drawPileCount}
                    position={[
                      DRAW_PILE_POSITION[0],
                      CARD_BASE_Y,
                      DRAW_PILE_POSITION[2],
                    ]}
                  />
                  <DiscardPile
                    card={snapshot.discardedCard}
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
                      cardCount={player.cardCount}
                      seat={SEATS[SEAT_ORDER[i]]}
                      seatIndex={i}
                      playerCount={playerCount}
                      faceUp={i === 0}
                      surfaceY={CARD_BASE_Y}
                      deckTopY={deckTopY}
                      dealBaseDelay={TABLE_SETTLE_MS}
                    />
                  ))}
                </>
              )}
            </Table>
          </Suspense>
        )}
        <OrbitControls target={[0, -0.5, 0]} enablePan={false} enableZoom={false} />
      </Canvas>
    </div>
  );
};
