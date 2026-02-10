import { useCallback, useRef, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectHasEnteredWelcome } from '@/store/slices/visitor';
import { selectMode } from '@/store/slices/theme';
import { WelcomeScreen } from '@/sections/WelcomeScreen';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { RestartButton } from '@/components/ui/RestartButton';
import { WildColorPicker } from '@/components/ui/WildColorPicker';
import { DrawChoiceModal } from '@/components/ui/DrawChoiceModal';
import { BackgroundScene } from '@/scenes/BackgroundScene';
import { useGameController } from '@/hooks/useGameController';
import type { Color } from 'uno-engine';

export const App = () => {
  const hasEnteredWelcome = useAppSelector(selectHasEnteredWelcome);
  const mode = useAppSelector(selectMode);
  const { startGame, playCard, drawCard, passAfterDraw } = useGameController();
  const [sceneReady, setSceneReady] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [pendingWildCardId, setPendingWildCardId] = useState<string | null>(null);
  const [drawnWildCardId, setDrawnWildCardId] = useState<string | null>(null);
  const handleSceneReady = useCallback(() => setSceneReady(true), []);
  const handleWelcomeExited = useCallback(() => setWelcomeDismissed(true), []);
  const handleWildCardPlayed = useCallback((cardId: string) => setPendingWildCardId(cardId), []);
  const handleWildDismiss = useCallback(() => {
    setPendingWildCardId(null);
    setDrawnWildCardId(null);
  }, []);
  const handleWildColorSelect = useCallback((color: Color) => {
    if (pendingWildCardId) playCard(pendingWildCardId, color);
    setPendingWildCardId(null);
    setDrawnWildCardId(null);
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
      setDrawnWildCardId(drawChoice.cardId);
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
      data-theme={mode}
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
        playableOverride={drawChoice ? [drawChoice.cardId] : drawnWildCardId ? [drawnWildCardId] : undefined}
        onDrawCardClicked={drawChoice ? handleDrawCardClicked : undefined}
      />
      <DrawChoiceModal open={drawChoice !== null} onPlay={handleDrawPlay} onSkip={handleDrawSkip} />
      <WildColorPicker open={pendingWildCardId != null} onColorSelect={handleWildColorSelect} onDismiss={handleWildDismiss} />
      <div className="relative z-10">
        <div className="fixed top-4 right-4 z-50 flex items-start gap-2">
          <ThemeToggle />
          <RestartButton onClick={() => {}} disabled />
        </div>
        {welcomeDismissed ? (
          <div>
            <span className="p-4 text-xs font-medium text-neutral-400">orielvinci.com</span>
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
