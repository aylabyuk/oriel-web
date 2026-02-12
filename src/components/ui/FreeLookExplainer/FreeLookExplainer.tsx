import { useSpring, animated } from '@react-spring/web';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/utils/cn';

type FreeLookExplainerProps = {
  open: boolean;
  onDismiss: () => void;
};

/** Mouse with left button highlighted + curved arrow */
const RotateDesktopIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8 shrink-0">
    <rect
      x="8"
      y="6"
      width="16"
      height="22"
      rx="8"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <line
      x1="16"
      y1="6"
      x2="16"
      y2="16"
      stroke="currentColor"
      strokeWidth="1"
      opacity={0.3}
    />
    <rect
      x="8.5"
      y="6.5"
      width="7"
      height="9"
      rx="3"
      fill="currentColor"
      opacity={0.35}
    />
    <path
      d="M26 10a6 6 0 0 1-3 5.2"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <path
      d="M23 16l1-2 2 1"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Mouse with scroll wheel highlighted + up/down arrows */
const ZoomDesktopIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8 shrink-0">
    <rect
      x="8"
      y="6"
      width="16"
      height="22"
      rx="8"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <line
      x1="16"
      y1="6"
      x2="16"
      y2="16"
      stroke="currentColor"
      strokeWidth="1"
      opacity={0.3}
    />
    <rect
      x="14.5"
      y="9"
      width="3"
      height="5"
      rx="1.5"
      fill="currentColor"
      opacity={0.5}
    />
    <path
      d="M27 10l0 4"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <path
      d="M25.8 11.2L27 10l1.2 1.2"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M25.8 12.8L27 14l1.2-1.2"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Mouse with right button highlighted + crossed arrows */
const PanDesktopIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8 shrink-0">
    <rect
      x="8"
      y="6"
      width="16"
      height="22"
      rx="8"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <line
      x1="16"
      y1="6"
      x2="16"
      y2="16"
      stroke="currentColor"
      strokeWidth="1"
      opacity={0.3}
    />
    <rect
      x="16.5"
      y="6.5"
      width="7"
      height="9"
      rx="3"
      fill="currentColor"
      opacity={0.35}
    />
    <path
      d="M27 16l0-4M27 16l0 4M25 14l2-2 2 2M25 18l2 2 2-2"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.6}
    />
  </svg>
);

/** Single finger with circular arrow */
const RotateMobileIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8 shrink-0">
    <circle cx="16" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
    <line
      x1="16"
      y1="16"
      x2="16"
      y2="26"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M24 8a8 8 0 0 1-2 6"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <path
      d="M22 14.5l1-2.5 2 1"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Pinch gesture — two fingers converging */
const ZoomMobileIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8 shrink-0">
    <circle cx="11" cy="10" r="3" stroke="currentColor" strokeWidth="1.2" />
    <line
      x1="11"
      y1="13"
      x2="11"
      y2="20"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <circle cx="21" cy="10" r="3" stroke="currentColor" strokeWidth="1.2" />
    <line
      x1="21"
      y1="13"
      x2="21"
      y2="20"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <path
      d="M13 23l3-3M19 23l-3-3"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <path
      d="M9 27l-2 2M23 27l2 2"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      opacity={0.4}
    />
  </svg>
);

/** Two fingers + move arrows */
const PanMobileIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8 shrink-0">
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.2" />
    <line
      x1="12"
      y1="13"
      x2="12"
      y2="21"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <circle cx="20" cy="10" r="3" stroke="currentColor" strokeWidth="1.2" />
    <line
      x1="20"
      y1="13"
      x2="20"
      y2="21"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <path
      d="M16 24l0 5M14.5 27.5L16 29l1.5-1.5"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ControlRow = ({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) => (
  <div className="flex items-center gap-2.5">
    <div className="text-neutral-500 dark:text-white/60">{icon}</div>
    <span className="text-xs leading-tight text-neutral-600 dark:text-white/70">
      {label}
    </span>
  </div>
);

export const FreeLookExplainer = ({
  open,
  onDismiss,
}: FreeLookExplainerProps) => {
  const { t } = useTranslation();
  const springs = useSpring({
    opacity: open ? 1 : 0,
    y: open ? 0 : -24,
    config: { tension: 260, friction: 20 },
  });

  return (
    // @ts-expect-error animated.div children type mismatch with React 19
    <animated.div
      className={cn(
        'fixed top-8 left-1/2 z-50 -translate-x-1/2 max-lg:portrait:top-20',
        'w-[min(90vw,360px)] rounded-2xl bg-white/90 px-5 py-4 shadow-xl backdrop-blur-sm dark:bg-neutral-900/90',
      )}
      style={{
        opacity: springs.opacity,
        y: springs.y,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <p className="mb-3 text-center text-sm font-semibold text-neutral-800 dark:text-white/90">
        {t('freeLookExplainer.title')}
      </p>

      {/* Desktop controls */}
      <div className="hidden space-y-2 sm:block">
        <ControlRow
          icon={<RotateDesktopIcon />}
          label={t('freeLookExplainer.desktop.rotate')}
        />
        <ControlRow
          icon={<ZoomDesktopIcon />}
          label={t('freeLookExplainer.desktop.zoom')}
        />
        <ControlRow
          icon={<PanDesktopIcon />}
          label={t('freeLookExplainer.desktop.pan')}
        />
      </div>

      {/* Mobile controls */}
      <div className="space-y-2 sm:hidden">
        <ControlRow
          icon={<RotateMobileIcon />}
          label={t('freeLookExplainer.mobile.rotate')}
        />
        <ControlRow
          icon={<ZoomMobileIcon />}
          label={t('freeLookExplainer.mobile.zoom')}
        />
        <ControlRow
          icon={<PanMobileIcon />}
          label={t('freeLookExplainer.mobile.pan')}
        />
      </div>

      <button
        onClick={onDismiss}
        className="mt-3 w-full cursor-pointer rounded-lg border border-neutral-300 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white dark:focus:ring-white/50"
      >
        {t('freeLookExplainer.dismiss')}
      </button>
    </animated.div>
  );
};
