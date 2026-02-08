import { useAppSelector } from '@/store/hooks';
import { selectHasEnteredWelcome } from '@/store/slices/visitor';
import { WelcomeScreen } from '@/sections/WelcomeScreen';
import { EnvironmentSelector } from '@/components/ui/EnvironmentSelector';
import { BackgroundScene } from '@/scenes/BackgroundScene';

export const App = () => {
  const hasEnteredWelcome = useAppSelector(selectHasEnteredWelcome);

  return (
    <div
      className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-black dark:text-white"
      data-theme="dark"
    >
      <BackgroundScene showTable={hasEnteredWelcome} />
      <div className="relative z-10">
        <div className="fixed top-4 right-4 z-50">
          <EnvironmentSelector />
        </div>
        {hasEnteredWelcome ? (
          <h1 className="p-8 text-4xl font-bold">Oriel Absin</h1>
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  );
};
