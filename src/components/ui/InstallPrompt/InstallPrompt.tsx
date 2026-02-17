import { useSpring, animated } from '@react-spring/web';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { cn } from '@/utils/cn';

export const InstallPrompt = () => {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt();

  const springs = useSpring({
    opacity: canInstall ? 1 : 0,
    y: canInstall ? 0 : 60,
    config: { tension: 200, friction: 24 },
  });

  if (!canInstall) return null;

  return (
    // @ts-expect-error animated.div children type mismatch with React 19
    <animated.div
      className={cn(
        'fixed bottom-4 left-1/2 z-60 flex w-[calc(100%-2rem)] max-w-sm',
        'items-center gap-3 rounded-2xl px-4 py-3',
        'bg-white/90 shadow-lg backdrop-blur-md',
        'dark:bg-neutral-900/90 dark:shadow-black/40',
      )}
      style={{
        opacity: springs.opacity,
        transform: springs.y.to((y) => `translate(-50%, ${y}px)`),
        pointerEvents: canInstall ? 'auto' : 'none',
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
          Install Oriel UNO
        </p>
        <p className="text-xs text-neutral-500 dark:text-white/50">
          Play offline anytime
        </p>
      </div>
      <button
        onClick={promptInstall}
        className={cn(
          'shrink-0 rounded-xl px-4 py-2 text-xs font-semibold',
          'bg-neutral-900 text-white transition-transform hover:scale-105',
          'focus:ring-2 focus:ring-neutral-400 focus:outline-none',
          'dark:bg-white/90 dark:text-neutral-900 dark:focus:ring-white/50',
          'cursor-pointer',
        )}
      >
        Install
      </button>
      <button
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className={cn(
          'shrink-0 flex h-7 w-7 items-center justify-center rounded-full',
          'text-neutral-400 transition-colors hover:text-neutral-700',
          'dark:text-white/40 dark:hover:text-white/80',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400',
          'cursor-pointer',
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </animated.div>
  );
};
