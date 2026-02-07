import { useAppSelector } from '@/store/hooks';
import { selectHasEnteredWelcome } from '@/store/slices/visitor';
import { WelcomeScreen } from '@/sections/WelcomeScreen';

export const App = () => {
  const hasEnteredWelcome = useAppSelector(selectHasEnteredWelcome);

  return (
    <div className="min-h-screen bg-black text-white">
      {hasEnteredWelcome ? (
        <h1 className="p-8 text-4xl font-bold">Oriel Absin</h1>
      ) : (
        <WelcomeScreen />
      )}
    </div>
  );
};
