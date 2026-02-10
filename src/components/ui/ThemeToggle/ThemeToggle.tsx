import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMode, selectMode } from '@/store/slices/theme';
import { cn } from '@/utils/cn';

export const ThemeToggle = () => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectMode);
  const isDark = mode === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-tooltip={isDark ? 'Light mode' : 'Dark mode'}
      onClick={() => dispatch(toggleMode())}
      className={cn(
        'relative flex h-9 w-9 cursor-pointer items-center justify-center',
        'rounded-full text-lg shadow-sm backdrop-blur-sm transition-colors',
        'bg-white/60 hover:bg-white/80 dark:bg-black/60 dark:hover:bg-black/80',
        'focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:outline-none',
        'dark:focus:ring-neutral-500',
        'after:pointer-events-none after:absolute after:top-full after:mt-2',
        'after:rounded after:bg-black/80 after:px-2 after:py-1',
        'after:text-xs after:whitespace-nowrap after:text-white after:opacity-0 after:transition-opacity',
        "after:content-[attr(data-tooltip)]",
        'hover:after:opacity-100',
      )}
    >
      {isDark ? (
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
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
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
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
};
