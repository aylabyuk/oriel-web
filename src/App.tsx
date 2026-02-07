import { useAppSelector } from '@/store/hooks';
import { selectHasEnteredWelcome } from '@/store/slices/visitor';
import { selectAccentColor } from '@/store/slices/theme';
import { WelcomeScreen } from '@/sections/WelcomeScreen';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';

export const App = () => {
  const hasEnteredWelcome = useAppSelector(selectHasEnteredWelcome);
  const accentColor = useAppSelector(selectAccentColor);

  return (
    <div className="min-h-screen bg-black text-white" data-accent={accentColor}>
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>
      {hasEnteredWelcome ? (
        <h1 className="p-8 text-4xl font-bold">Oriel Absin</h1>
      ) : (
        <WelcomeScreen />
      )}
    </div>
  );
};
