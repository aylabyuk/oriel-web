import { useSpring, animated } from '@react-spring/web';

type ChallengeModalProps = {
  open: boolean;
  blufferName: string;
  onAccept: () => void;
  onChallenge: () => void;
};

export const ChallengeModal = ({ open, blufferName, onAccept, onChallenge }: ChallengeModalProps) => {
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
      <span className="mr-1 text-sm font-medium text-white/80">
        {blufferName} played Wild Draw 4!
      </span>
      <button
        onClick={onChallenge}
        className="cursor-pointer rounded-lg bg-red-500/90 px-4 py-1.5 text-sm font-semibold text-white transition-transform hover:scale-105 focus:ring-2 focus:ring-white/50 focus:outline-none"
      >
        Challenge
      </button>
      <button
        onClick={onAccept}
        className="cursor-pointer rounded-lg border border-white/20 px-4 py-1.5 text-sm font-medium text-white/70 transition-transform hover:scale-105 hover:text-white focus:ring-2 focus:ring-white/50 focus:outline-none"
      >
        Accept
      </button>
    </animated.div>
  );
};
