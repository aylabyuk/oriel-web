import { useAppSelector } from '@/store/hooks';
import { selectHasEnteredWelcome } from '@/store/slices/visitor';
import { selectThemeMode } from '@/store/slices/theme';
import { WelcomeScreen } from '@/sections/WelcomeScreen';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export const App = () => {
  const hasEnteredWelcome = useAppSelector(selectHasEnteredWelcome);
  const mode = useAppSelector(selectThemeMode);

  return (
    <div
      className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-black dark:text-white"
      data-theme={mode}
    >
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {hasEnteredWelcome ? (
        <h1 className="p-8 text-4xl font-bold">Oriel Absin</h1>
      ) : (
        <WelcomeScreen />
      )}
    </div>
  );
};
