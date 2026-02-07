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
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-lg transition-colors hover:bg-neutral-200 focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:ring-offset-white focus:outline-none dark:hover:bg-neutral-800 dark:focus:ring-neutral-500 dark:focus:ring-offset-black"
    >
      {mode === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
    </button>
  );
};
