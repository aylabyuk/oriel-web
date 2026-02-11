import { cn } from '@/utils/cn';
import { useTranslation } from '@/hooks/useTranslation';

type FreeLookToggleProps = {
  active: boolean;
  onClick: () => void;
};

export const FreeLookToggle = ({ active, onClick }: FreeLookToggleProps) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      aria-label={
        active
          ? t('toolbar.disableFreeLook')
          : t('toolbar.enableFreeLook')
      }
      data-tooltip={active ? t('toolbar.freeLook') : t('toolbar.lockedView')}
      onClick={onClick}
      className={cn(
        'relative flex h-9 w-9 cursor-pointer items-center justify-center',
        'rounded-full text-lg shadow-sm backdrop-blur-sm transition-colors',
        active
          ? 'bg-white/90 dark:bg-white/80'
          : 'bg-white/60 hover:bg-white/80 dark:bg-black/60 dark:hover:bg-black/80',
        'focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:outline-none',
        'dark:focus:ring-neutral-500',
        'after:pointer-events-none after:absolute after:top-full after:mt-2',
        'after:rounded after:border after:border-white/20 after:bg-black/80 after:px-2 after:py-1',
        'after:text-xs after:whitespace-nowrap after:text-white after:opacity-0 after:transition-opacity',
        'after:content-[attr(data-tooltip)]',
        'hover:after:opacity-100',
      )}
    >
      {/* Eye icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          'h-4 w-4',
          active ? 'text-neutral-900' : 'text-neutral-900 dark:text-white',
        )}
      >
        {active ? (
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </>
        ) : (
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </>
        )}
      </svg>
    </button>
  );
};
