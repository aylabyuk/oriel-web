import { useSpring, animated } from '@react-spring/web';
import { useTranslation } from '@/hooks/useTranslation';

type DisclaimerModalProps = {
  open: boolean;
  visitorName: string;
  onAcknowledge: () => void;
};

export const DisclaimerModal = ({
  open,
  visitorName,
  onAcknowledge,
}: DisclaimerModalProps) => {
  const { t } = useTranslation();

  const springs = useSpring({
    opacity: open ? 1 : 0,
    scale: open ? 1 : 0.9,
    config: { tension: 200, friction: 22 },
  });

  return (
    // @ts-expect-error animated.div children type mismatch with React 19
    <animated.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{
        opacity: springs.opacity,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      {/* @ts-expect-error animated.div children type mismatch with React 19 */}
      <animated.div
        className="relative z-10 flex w-full max-w-sm flex-col gap-5 rounded-3xl bg-white/90 px-8 py-8 backdrop-blur-md dark:bg-neutral-900/90"
        style={{ scale: springs.scale }}
      >
        <p className="text-base font-semibold text-neutral-900 dark:text-white">
          {t('disclaimer.greeting', { name: visitorName })}
        </p>

        <p className="text-sm leading-relaxed text-neutral-600 dark:text-white/70">
          {t('disclaimer.body')}
        </p>

        <p className="text-xs leading-relaxed text-neutral-400 italic dark:text-white/50">
          {t('disclaimer.landscape')}
        </p>

        <div className="text-sm text-neutral-600 dark:text-white/70">
          <p>{t('disclaimer.closing')}</p>
          <p className="font-semibold text-neutral-900 dark:text-white">
            {t('disclaimer.signature')}
          </p>
        </div>

        <button
          onClick={onAcknowledge}
          className="mt-1 w-full cursor-pointer rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:bg-white/90 dark:text-neutral-900 dark:focus:ring-white/50"
        >
          {t('disclaimer.button')}
        </button>
      </animated.div>
    </animated.div>
  );
};
