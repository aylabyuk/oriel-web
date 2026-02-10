import { useCallback, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectHasEnteredWelcome } from '@/store/slices/visitor';
import { WelcomeScreen } from '@/sections/WelcomeScreen';
import { RestartButton } from '@/components/ui/RestartButton';
import { WildColorPicker } from '@/components/ui/WildColorPicker';
import { BackgroundScene } from '@/scenes/BackgroundScene';
import { useGameController } from '@/hooks/useGameController';
import type { Color } from 'uno-engine';

export const App = () => {
  const hasEnteredWelcome = useAppSelector(selectHasEnteredWelcome);
  const { startGame, playCard } = useGameController();
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

  return (
    <div
      className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-black dark:text-white"
      data-theme="dark"
    >
      <BackgroundScene
        showTable={hasEnteredWelcome}
        onStartGame={startGame}
        onPlayCard={playCard}
        onWildCardPlayed={handleWildCardPlayed}
        onSceneReady={handleSceneReady}
      />
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
