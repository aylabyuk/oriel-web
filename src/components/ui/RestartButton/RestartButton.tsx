import { cn } from '@/utils/cn';
import { useTranslation } from '@/hooks/useTranslation';

type RestartButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export const RestartButton = ({
  onClick,
  disabled = false,
}: RestartButtonProps) => {
  const { t } = useTranslation();
  const label = t('toolbar.restartGame');

  return (
    <button
      type="button"
      aria-label={label}
      data-tooltip={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex h-9 w-9 cursor-pointer items-center justify-center',
        'rounded-full text-lg shadow-sm backdrop-blur-sm transition-colors',
        'bg-white/60 hover:bg-white/80 dark:bg-black/60 dark:hover:bg-black/80',
        'focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:outline-none',
        'dark:focus:ring-neutral-500',
        disabled && 'pointer-events-none opacity-40',
        'after:pointer-events-none after:absolute after:top-full after:mt-2',
        'after:rounded after:border after:border-white/20 after:bg-black/80 after:px-2 after:py-1',
        'after:text-xs after:whitespace-nowrap after:text-white after:opacity-0 after:transition-opacity',
        'after:content-[attr(data-tooltip)]',
        'hover:after:opacity-100',
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
      </svg>
    </button>
  );
};
