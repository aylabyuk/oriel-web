import { useSpring, animated } from '@react-spring/web';
import { cn } from '@/utils/cn';

type RatingCardsProps = {
  value: number;
  onChange: (rating: number) => void;
};

const CARD_COLORS = [
  '#ef6f6f', // Red — 1
  '#5b8ef5', // Blue — 2
  '#4dcb7a', // Green — 3
  '#f0b84d', // Yellow — 4
  '#a855f7', // Wild purple — 5
] as const;

const CardButton = ({
  index,
  selected,
  onSelect,
}: {
  index: number;
  selected: boolean;
  onSelect: () => void;
}) => {
  const spring = useSpring({
    rotateY: selected ? 0 : 180,
    scale: selected ? 1.08 : 1,
    config: { tension: 300, friction: 22 },
  });

  const color = CARD_COLORS[index];
  const number = index + 1;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Rate ${number} out of 5`}
      className="cursor-pointer"
      style={{ perspective: '400px' }}
    >
      {/* @ts-expect-error animated.div children type mismatch with React 19 */}
      <animated.div
        className="relative h-14 w-10"
        style={{
          transform: spring.rotateY.to(
            (r) => `rotateY(${r}deg) scale(${spring.scale.get()})`,
          ),
          transformStyle: 'preserve-3d',
          scale: spring.scale,
        }}
      >
        {/* Front face — colored card with number */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-lg shadow-md backface-hidden"
          style={{
            backgroundColor: color,
            backfaceVisibility: 'hidden',
            boxShadow: selected ? `0 0 12px ${color}60` : undefined,
          }}
        >
          <span className="text-lg font-extrabold text-white drop-shadow-sm">
            {number}
          </span>
        </div>

        {/* Back face — card back */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-lg border-2',
            'border-neutral-300 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800',
            'backface-hidden',
          )}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="h-8 w-5 rounded-sm border border-neutral-300 bg-neutral-300 dark:border-neutral-600 dark:bg-neutral-700" />
        </div>
      </animated.div>
    </button>
  );
};

export const RatingCards = ({ value, onChange }: RatingCardsProps) => (
  <div className="flex items-center justify-center gap-2">
    {CARD_COLORS.map((_, i) => (
      <CardButton
        key={i}
        index={i}
        selected={i + 1 <= value}
        onSelect={() => onChange(i + 1 === value ? 0 : i + 1)}
      />
    ))}
  </div>
);
