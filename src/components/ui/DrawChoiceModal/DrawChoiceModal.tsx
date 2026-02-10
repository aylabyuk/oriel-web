import { useSpring, animated } from '@react-spring/web';

type DrawChoiceModalProps = {
  open: boolean;
  onPlay: () => void;
  onSkip: () => void;
};

export const DrawChoiceModal = ({ open, onPlay, onSkip }: DrawChoiceModalProps) => {
  const springs = useSpring({
    opacity: open ? 1 : 0,
    y: open ? 0 : -24,
    config: { tension: 260, friction: 20 },
  });

  return (
    // @ts-expect-error animated.div children type mismatch with React 19
    <animated.div
      className="fixed top-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-neutral-900/80 px-6 py-4 backdrop-blur-sm"
      style={{
        opacity: springs.opacity,
        y: springs.y,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <span className="mr-1 text-sm font-medium text-white/80">Play drawn card?</span>
      <button
        onClick={onPlay}
        className="cursor-pointer rounded-lg bg-white/90 px-4 py-1.5 text-sm font-semibold text-neutral-900 transition-transform hover:scale-105 focus:ring-2 focus:ring-white/50 focus:outline-none"
      >
        Play
      </button>
      <button
        onClick={onSkip}
        className="cursor-pointer rounded-lg border border-white/20 px-4 py-1.5 text-sm font-medium text-white/70 transition-transform hover:scale-105 hover:text-white focus:ring-2 focus:ring-white/50 focus:outline-none"
      >
        Skip
      </button>
    </animated.div>
  );
};
