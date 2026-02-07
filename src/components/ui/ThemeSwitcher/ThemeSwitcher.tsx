import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAccentColor, selectAccentColor } from '@/store/slices/theme';
import { cn } from '@/utils/cn';
import type { CardColor } from '@/types/game';

const UNO_PAIRS: {
  color: CardColor;
  label: string;
  accent: string;
  secondary: string;
}[] = [
  { color: 'red', label: 'Red & Blue', accent: '#ef4444', secondary: '#3b82f6' },
  { color: 'blue', label: 'Blue & Yellow', accent: '#3b82f6', secondary: '#facc15' },
  { color: 'green', label: 'Green & Red', accent: '#22c55e', secondary: '#ef4444' },
  { color: 'yellow', label: 'Yellow & Green', accent: '#facc15', secondary: '#22c55e' },
];

export const ThemeSwitcher = () => {
  const dispatch = useAppDispatch();
  const currentColor = useAppSelector(selectAccentColor);

  return (
    <div
      className="flex items-center gap-3"
      role="radiogroup"
      aria-label="Color theme"
    >
      {UNO_PAIRS.map(({ color, label, accent, secondary }) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={currentColor === color}
          aria-label={label}
          onClick={() => dispatch(setAccentColor(color))}
          style={{
            background: `linear-gradient(135deg, ${accent} 50%, ${secondary} 50%)`,
          }}
          className={cn(
            'h-8 w-8 cursor-pointer rounded-full transition-all duration-200',
            'hover:scale-110 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black focus:outline-none',
            currentColor === color
              ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black'
              : 'opacity-60 hover:opacity-100',
          )}
        />
      ))}
    </div>
  );
};
