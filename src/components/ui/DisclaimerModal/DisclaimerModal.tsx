import { useSpring, animated } from '@react-spring/web';
import { useTranslation } from '@/hooks/useTranslation';
import {
  AI_STRATEGIST,
  AI_TRASH_TALKER,
  AI_CHILL,
  AVATAR_COLORS,
} from '@/constants/players';

const FRIENDS = [
  { name: AI_STRATEGIST, key: 'meio' as const },
  { name: AI_TRASH_TALKER, key: 'mark' as const },
  { name: AI_CHILL, key: 'paul' as const },
];

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

        <ul className="flex flex-col gap-2.5">
          {FRIENDS.map(({ name, key }) => (
            <li key={name} className="flex items-start gap-2.5">
              <div
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: AVATAR_COLORS[name] }}
              >
                {name.charAt(0)}
              </div>
              <div className="min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {name}
                </span>
                <p className="text-xs leading-snug text-neutral-500 dark:text-white/50">
                  {t(`disclaimer.${key}`)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <p className="text-xs leading-relaxed text-neutral-400 italic dark:text-white/50">
          {t('disclaimer.headsUp')}
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
