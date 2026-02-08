import { useSpring, animated } from '@react-spring/web';
import { useAppSelector } from '@/store/hooks';
import { selectHasEnteredWelcome } from '@/store/slices/visitor';
import { selectReducedMotion } from '@/store/slices/theme';
import { WelcomeScreen } from '@/sections/WelcomeScreen';
import { EnvironmentSelector } from '@/components/ui/EnvironmentSelector';
import { BackgroundScene } from '@/scenes/BackgroundScene';

export const App = () => {
  const hasEnteredWelcome = useAppSelector(selectHasEnteredWelcome);
  const reducedMotion = useAppSelector(selectReducedMotion);

  const contentSpring = useSpring({
    opacity: hasEnteredWelcome ? 1 : 0,
    immediate: reducedMotion,
  });

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
          <animated.div style={contentSpring}>
            <h1 className="p-8 text-4xl font-bold">Oriel Absin</h1>
          </animated.div>
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  );
};
