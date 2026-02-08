import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setEnvironment,
  selectEnvironment,
  type EnvironmentPreset,
} from '@/store/slices/theme';
import { cn } from '@/utils/cn';

const PRESETS: { preset: EnvironmentPreset; icon: string; label: string }[] = [
  { preset: 'sunset', icon: '\u{1F307}', label: 'Sunset' },
  { preset: 'dawn', icon: '\u{1F305}', label: 'Dawn' },
  { preset: 'night', icon: '\u{1F319}', label: 'Night' },
  { preset: 'city', icon: '\u{1F3D9}\uFE0F', label: 'City' },
  { preset: 'forest', icon: '\u{1F332}', label: 'Forest' },
  { preset: 'park', icon: '\u{1F333}', label: 'Park' },
];

export const EnvironmentSelector = () => {
  const dispatch = useAppDispatch();
  const current = useAppSelector(selectEnvironment);

  return (
    <div role="radiogroup" aria-label="Environment" className="flex gap-1">
      {PRESETS.map(({ preset, icon, label }) => (
        <button
          key={preset}
          type="button"
          role="radio"
          aria-checked={current === preset}
          aria-label={label}
          data-tooltip={label}
          onClick={() => dispatch(setEnvironment(preset))}
          className={cn(
            'relative flex h-9 w-9 cursor-pointer items-center justify-center',
            'rounded-full text-lg shadow-sm backdrop-blur-sm transition-colors',
            'hover:bg-white/80 focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:outline-none',
            'dark:hover:bg-black/80 dark:focus:ring-neutral-500',
            'after:pointer-events-none after:absolute after:top-full after:mt-2',
            'after:rounded after:bg-black/80 after:px-2 after:py-1',
            'after:text-xs after:text-white after:opacity-0 after:transition-opacity',
            "after:content-[attr(data-tooltip)]",
            'hover:after:opacity-100',
            current === preset
              ? 'bg-white/80 ring-2 ring-neutral-400 dark:bg-black/80 dark:ring-neutral-500'
              : 'bg-white/60 dark:bg-black/60',
          )}
        >
          {icon}
        </button>
      ))}
    </div>
  );
};
