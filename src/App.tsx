import { useAppSelector } from '@/store/hooks';
import { selectHasEnteredWelcome } from '@/store/slices/visitor';
import { WelcomeScreen } from '@/sections/WelcomeScreen';
import { EnvironmentSelector } from '@/components/ui/EnvironmentSelector';
import { RestartButton } from '@/components/ui/RestartButton';
import { BackgroundScene } from '@/scenes/BackgroundScene';
import { useGameController } from '@/hooks/useGameController';

export const App = () => {
  const hasEnteredWelcome = useAppSelector(selectHasEnteredWelcome);
  const { startGame } = useGameController();

  return (
    <div
      className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-black dark:text-white"
      data-theme="dark"
    >
      <BackgroundScene showTable={hasEnteredWelcome} onStartGame={startGame} />
      <div className="relative z-10">
        <div className="fixed top-4 right-4 z-50 flex items-start gap-2">
          <RestartButton onClick={() => {}} disabled />
          <EnvironmentSelector />
        </div>
        {hasEnteredWelcome ? (
          <div>
            <h1 className="p-8 text-4xl font-bold">Oriel Absin</h1>
          </div>
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  );
};
