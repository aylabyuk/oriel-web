import { useSpring, animated } from '@react-spring/web';
import {
  AI_STRATEGIST,
  AI_TRASH_TALKER,
  AI_CHILL,
  AVATAR_COLORS,
} from '@/constants/players';
import { cn } from '@/utils/cn';

type FavoriteOpponentProps = {
  value: string;
  onChange: (name: string) => void;
};

const OPPONENTS = [AI_STRATEGIST, AI_TRASH_TALKER, AI_CHILL] as const;

const OpponentChip = ({
  name,
  selected,
  onSelect,
}: {
  name: string;
  selected: boolean;
  onSelect: () => void;
}) => {
  const color = AVATAR_COLORS[name] ?? '#888';

  const spring = useSpring({
    scale: selected ? 1.1 : 1,
    config: { tension: 300, friction: 20 },
  });

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex cursor-pointer flex-col items-center gap-1"
      aria-label={`Pick ${name} as favorite`}
      aria-pressed={selected}
    >
      <animated.div
        className={cn(
          'flex size-9 items-center justify-center rounded-full text-sm font-bold text-white transition-shadow',
          selected && 'ring-2 ring-offset-2 dark:ring-offset-neutral-900',
        )}
        style={{
          backgroundColor: color,
          scale: spring.scale,
          // @ts-expect-error ringColor not typed in react-spring CSSProperties
          '--tw-ring-color': selected ? color : undefined,
          boxShadow: selected ? `0 0 10px ${color}50` : 'none',
        }}
      >
        {name[0]}
      </animated.div>
      <span
        className={cn(
          'text-[10px] transition-colors',
          selected
            ? 'font-medium text-neutral-700 dark:text-neutral-200'
            : 'text-neutral-400 dark:text-neutral-500',
        )}
      >
        {name}
      </span>
    </button>
  );
};

export const FavoriteOpponent = ({ value, onChange }: FavoriteOpponentProps) => (
  <div className="flex items-end justify-center gap-5">
    {OPPONENTS.map((name) => (
      <OpponentChip
        key={name}
        name={name}
        selected={value === name}
        onSelect={() => onChange(value === name ? '' : name)}
      />
    ))}
  </div>
);
