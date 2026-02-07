import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleThemeMode, selectThemeMode } from '@/store/slices/theme';

export const ThemeToggle = () => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectThemeMode);

  return (
    <button
      type="button"
      aria-label={
        mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      }
      onClick={() => dispatch(toggleThemeMode())}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/60 text-lg shadow-sm backdrop-blur-sm transition-colors hover:bg-white/80 focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:outline-none dark:bg-black/60 dark:hover:bg-black/80 dark:focus:ring-neutral-500"
    >
      {mode === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
    </button>
  );
};
