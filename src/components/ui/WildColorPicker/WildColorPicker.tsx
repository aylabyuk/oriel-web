import { useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { Color } from 'uno-engine';

const COLORS = [
  { label: 'Red', hex: '#ef6f6f', color: Color.RED },
  { label: 'Blue', hex: '#5b8ef5', color: Color.BLUE },
  { label: 'Green', hex: '#4dcb7a', color: Color.GREEN },
  { label: 'Yellow', hex: '#f0b84d', color: Color.YELLOW },
] as const;

type WildColorPickerProps = {
  open: boolean;
  onColorSelect: (color: Color) => void;
  onDismiss: () => void;
};

export const WildColorPicker = ({
  open,
  onColorSelect,
  onDismiss,
}: WildColorPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const springs = useSpring({
    opacity: open ? 1 : 0,
    y: open ? 0 : -24,
    config: { tension: 260, friction: 20 },
  });

  // Dismiss on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onDismiss();
      }
    };
    window.addEventListener('pointerdown', handleClick);
    return () => window.removeEventListener('pointerdown', handleClick);
  }, [open, onDismiss]);

  return (
    // @ts-expect-error animated.div children type mismatch with React 19
    <animated.div
      ref={containerRef}
      className="fixed top-8 left-1/2 z-50 flex -translate-x-1/2 gap-4 rounded-2xl bg-neutral-900/80 px-6 py-4 backdrop-blur-sm"
      style={{
        opacity: springs.opacity,
        y: springs.y,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {COLORS.map((c) => (
        <button
          key={c.label}
          aria-label={c.label}
          onClick={() => onColorSelect(c.color)}
          className="h-10 w-10 cursor-pointer rounded-full border-2 border-white/20 transition-transform hover:scale-110 focus:ring-2 focus:ring-white/50 focus:outline-none"
          style={{ backgroundColor: c.hex }}
        />
      ))}
    </animated.div>
  );
};
