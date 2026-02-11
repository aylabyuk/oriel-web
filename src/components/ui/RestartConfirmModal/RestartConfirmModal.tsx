import { useSpring, animated } from '@react-spring/web';
import { useTranslation } from '@/hooks/useTranslation';

type RestartConfirmModalProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const RestartConfirmModal = ({
  open,
  onConfirm,
  onCancel,
}: RestartConfirmModalProps) => {
  const { t } = useTranslation();
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
        {t('restart.prompt')}
      </span>
      <button
        onClick={onConfirm}
        className="cursor-pointer rounded-lg bg-red-500/90 px-4 py-1.5 text-sm font-semibold text-white transition-transform hover:scale-105 focus:ring-2 focus:ring-white/50 focus:outline-none"
      >
        {t('restart.confirm')}
      </button>
      <button
        onClick={onCancel}
        className="cursor-pointer rounded-lg border border-white/20 px-4 py-1.5 text-sm font-medium text-white/70 transition-transform hover:scale-105 hover:text-white focus:ring-2 focus:ring-white/50 focus:outline-none"
      >
        {t('restart.cancel')}
      </button>
    </animated.div>
  );
};
