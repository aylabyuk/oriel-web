import { useCallback, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectHasEnteredWelcome } from '@/store/slices/visitor';
import { WelcomeScreen } from '@/sections/WelcomeScreen';
import { RestartButton } from '@/components/ui/RestartButton';
import { BackgroundScene } from '@/scenes/BackgroundScene';
import { useGameController } from '@/hooks/useGameController';

export const App = () => {
  const hasEnteredWelcome = useAppSelector(selectHasEnteredWelcome);
  const { startGame, playCard } = useGameController();
  const [sceneReady, setSceneReady] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const handleSceneReady = useCallback(() => setSceneReady(true), []);
  const handleWelcomeExited = useCallback(() => setWelcomeDismissed(true), []);

  return (
    <div
      className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-black dark:text-white"
      data-theme="dark"
    >
      <BackgroundScene
        showTable={hasEnteredWelcome}
        onStartGame={startGame}
        onPlayCard={playCard}
        onSceneReady={handleSceneReady}
      />
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
