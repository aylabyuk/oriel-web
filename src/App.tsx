import { useCallback, useRef, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectHasEnteredWelcome } from '@/store/slices/visitor';
import { WelcomeScreen } from '@/sections/WelcomeScreen';
import { RestartButton } from '@/components/ui/RestartButton';
import { WildColorPicker } from '@/components/ui/WildColorPicker';
import { DrawChoiceModal } from '@/components/ui/DrawChoiceModal';
import { BackgroundScene } from '@/scenes/BackgroundScene';
import { useGameController } from '@/hooks/useGameController';
import type { Color } from 'uno-engine';

export const App = () => {
  const hasEnteredWelcome = useAppSelector(selectHasEnteredWelcome);
  const { startGame, playCard, drawCard, passAfterDraw } = useGameController();
  const [sceneReady, setSceneReady] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [pendingWildCardId, setPendingWildCardId] = useState<string | null>(null);
  const handleSceneReady = useCallback(() => setSceneReady(true), []);
  const handleWelcomeExited = useCallback(() => setWelcomeDismissed(true), []);
  const handleWildCardPlayed = useCallback((cardId: string) => setPendingWildCardId(cardId), []);
  const handleWildDismiss = useCallback(() => setPendingWildCardId(null), []);
  const handleWildColorSelect = useCallback((color: Color) => {
    if (pendingWildCardId) playCard(pendingWildCardId, color);
    setPendingWildCardId(null);
  }, [pendingWildCardId, playCard]);

  // --- Draw-choice flow ---
  const pendingDrawRef = useRef<{ cardId: string; isPlayable: boolean; isWild: boolean } | null>(null);
  const [drawPending, setDrawPending] = useState(false);
  const [drawChoice, setDrawChoice] = useState<{ cardId: string; isWild: boolean } | null>(null);

  const handleDrawCard = useCallback(() => {
    const result = drawCard();
    pendingDrawRef.current = result;
    if (result) setDrawPending(true);
  }, [drawCard]);

  const handleAnimationIdle = useCallback(() => {
    const pending = pendingDrawRef.current;
    if (!pending) return;
    pendingDrawRef.current = null;
    setDrawPending(false);
    if (pending.isPlayable) {
      setDrawChoice({ cardId: pending.cardId, isWild: pending.isWild });
    } else {
      passAfterDraw();
    }
  }, [passAfterDraw]);

  const handleDrawPlay = useCallback(() => {
    if (!drawChoice) return;
    if (drawChoice.isWild) {
      setPendingWildCardId(drawChoice.cardId);
    } else {
      playCard(drawChoice.cardId);
    }
    setDrawChoice(null);
  }, [drawChoice, playCard]);

  const handleDrawCardClicked = useCallback((_cardId: string) => handleDrawPlay(), [handleDrawPlay]);

  const handleDrawSkip = useCallback(() => {
    setDrawChoice(null);
    passAfterDraw();
  }, [passAfterDraw]);

  return (
    <div
      className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-black dark:text-white"
      data-theme="dark"
    >
      <BackgroundScene
        showTable={hasEnteredWelcome}
        onStartGame={startGame}
        onPlayCard={playCard}
        onDrawCard={handleDrawCard}
        onAnimationIdle={handleAnimationIdle}
        onWildCardPlayed={handleWildCardPlayed}
        onSceneReady={handleSceneReady}
        deckEnabled={!drawPending && drawChoice === null}
        playableOverride={drawChoice ? [drawChoice.cardId] : undefined}
        onDrawCardClicked={drawChoice ? handleDrawCardClicked : undefined}
      />
      <DrawChoiceModal open={drawChoice !== null} onPlay={handleDrawPlay} onSkip={handleDrawSkip} />
      <WildColorPicker open={pendingWildCardId != null} onColorSelect={handleWildColorSelect} onDismiss={handleWildDismiss} />
      <div className="relative z-10">
        <div className="fixed top-4 right-4 z-50 flex items-start gap-2">
          <RestartButton onClick={() => {}} disabled />
        </div>
        {welcomeDismissed ? (
          <div>
            <h1 className="p-8 text-4xl font-bold">Oriel Absin</h1>
          </div>
        ) : (
          <WelcomeScreen
            loading={hasEnteredWelcome}
            exiting={sceneReady}
            onExited={handleWelcomeExited}
          />
        )}
      </div>
    </div>
  );
};
