import { useSpring, animated } from '@react-spring/web';
import { useTranslation } from '@/hooks/useTranslation';

type ChallengeModalProps = {
  open: boolean;
  blufferName: string;
  onAccept: () => void;
  onChallenge: () => void;
};

export const ChallengeModal = ({
  open,
  blufferName,
  onAccept,
  onChallenge,
}: ChallengeModalProps) => {
  const { t } = useTranslation();
  const springs = useSpring({
    opacity: open ? 1 : 0,
    y: open ? 0 : -24,
    config: { tension: 260, friction: 20 },
  });

  return (
    // @ts-expect-error animated.div children type mismatch with React 19
    <animated.div
      className="fixed top-8 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-3 rounded-2xl bg-neutral-900/80 px-6 py-4 backdrop-blur-sm max-lg:portrait:top-20"
      style={{
        opacity: springs.opacity,
        y: springs.y,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <span className="text-sm font-medium text-white/80">
        {t('challenge.playedWildDrawFour', { name: blufferName })}
      </span>
      <div className="flex gap-3">
        <button
          onClick={onChallenge}
          className="cursor-pointer rounded-lg bg-red-500/90 px-4 py-1.5 text-sm font-semibold text-white transition-transform hover:scale-105 focus:ring-2 focus:ring-white/50 focus:outline-none"
        >
          {t('challenge.challenge')}
        </button>
        <button
          onClick={onAccept}
          className="cursor-pointer rounded-lg border border-white/20 px-4 py-1.5 text-sm font-medium text-white/70 transition-transform hover:scale-105 hover:text-white focus:ring-2 focus:ring-white/50 focus:outline-none"
        >
          {t('challenge.accept')}
        </button>
      </div>
    </animated.div>
  );
};
