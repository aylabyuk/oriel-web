import { cn } from '@/utils/cn';

type IconButtonProps = {
  ariaLabel: string;
  tooltip: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
};

export const IconButton = ({
  ariaLabel,
  tooltip,
  onClick,
  active = false,
  disabled = false,
  children,
}: IconButtonProps) => {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      data-tooltip={tooltip}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex h-9 w-9 cursor-pointer items-center justify-center',
        'rounded-full text-lg shadow-sm backdrop-blur-sm transition-colors',
        'bg-white/60 hover:bg-white/80 dark:bg-black/60 dark:hover:bg-black/80',
        active && 'ring-2 ring-white',
        disabled && 'pointer-events-none opacity-40',
        'focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:outline-none',
        'dark:focus:ring-neutral-500',
        'after:pointer-events-none after:absolute after:top-full after:mt-2',
        'after:rounded after:border after:border-white/20 after:bg-black/80 after:px-2 after:py-1',
        'after:text-xs after:whitespace-nowrap after:text-white after:opacity-0 after:transition-opacity',
        'after:content-[attr(data-tooltip)]',
        'hover:after:opacity-100',
      )}
    >
      {children}
    </button>
  );
};
