import { useCallback, useRef, useState } from 'react';
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
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const activePreset = PRESETS.find((p) => p.preset === current) ?? PRESETS[0];

  const showOptions = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }, []);

  const hideOptions = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 200);
  }, []);

  const handleSelect = (preset: EnvironmentPreset) => {
    dispatch(setEnvironment(preset));
    setOpen(false);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Environment"
      className="relative flex flex-col items-center gap-1"
      onMouseEnter={showOptions}
      onMouseLeave={hideOptions}
    >
      {/* Active preset button — always visible */}
      <button
        type="button"
        role="radio"
        aria-checked
        aria-label={activePreset.label}
        onClick={showOptions}
        className={cn(
          'relative flex h-9 w-9 cursor-pointer items-center justify-center',
          'rounded-full text-lg shadow-sm backdrop-blur-sm',
          'bg-white/80 ring-2 ring-neutral-400 dark:bg-black/80 dark:ring-neutral-500',
        )}
      >
        {activePreset.icon}
      </button>

      {/* Expandable option tray */}
      {open &&
        PRESETS.filter((p) => p.preset !== current).map(({ preset, icon, label }) => (
          <button
            key={preset}
            type="button"
            role="radio"
            aria-checked={false}
            aria-label={label}
            data-tooltip={label}
            onClick={() => handleSelect(preset)}
            className={cn(
              'relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center',
              'rounded-full text-lg shadow-sm backdrop-blur-sm transition-colors',
              'bg-white/60 hover:bg-white/80 dark:bg-black/60 dark:hover:bg-black/80',
              'focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:outline-none',
              'dark:focus:ring-neutral-500',
              'after:pointer-events-none after:absolute after:right-full after:mr-2',
              'after:top-1/2 after:-translate-y-1/2',
              'after:rounded after:bg-black/80 after:px-2 after:py-1',
              'after:text-xs after:whitespace-nowrap after:text-white after:opacity-0 after:transition-opacity',
              "after:content-[attr(data-tooltip)]",
              'hover:after:opacity-100',
            )}
          >
            {icon}
          </button>
        ))}
    </div>
  );
};
