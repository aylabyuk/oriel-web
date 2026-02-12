import { useSpring, animated } from '@react-spring/web';
import { useTranslation } from '@/hooks/useTranslation';

type DrawChoiceModalProps = {
  open: boolean;
  onPlay: () => void;
  onSkip: () => void;
};

export const DrawChoiceModal = ({
  open,
  onPlay,
  onSkip,
}: DrawChoiceModalProps) => {
  const { t } = useTranslation();
  const springs = useSpring({
    opacity: open ? 1 : 0,
    y: open ? 0 : -24,
    config: { tension: 260, friction: 20 },
  });

  return (
    // @ts-expect-error animated.div children type mismatch with React 19
    <animated.div
      className="fixed top-8 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-3 rounded-2xl bg-white/80 px-6 py-4 backdrop-blur-sm max-lg:portrait:top-20 dark:bg-neutral-900/80"
      style={{
        opacity: springs.opacity,
        y: springs.y,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <span className="text-sm font-medium text-neutral-700 dark:text-white/80">
        {t('draw.playDrawnCard')}
      </span>
      <div className="flex gap-3">
        <button
          onClick={onPlay}
          className="cursor-pointer rounded-lg bg-neutral-900 px-4 py-1.5 text-sm font-semibold text-white transition-transform hover:scale-105 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:bg-white/90 dark:text-neutral-900 dark:focus:ring-white/50"
        >
          {t('draw.play')}
        </button>
        <button
          onClick={onSkip}
          className="cursor-pointer rounded-lg border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-600 transition-transform hover:scale-105 hover:text-neutral-800 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:border-white/20 dark:text-white/70 dark:hover:text-white dark:focus:ring-white/50"
        >
          {t('draw.skip')}
        </button>
      </div>
    </animated.div>
  );
};
