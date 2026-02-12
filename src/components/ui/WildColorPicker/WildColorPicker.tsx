import { useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import type { Color } from 'uno-engine';
import { useTranslation } from '@/hooks/useTranslation';
import { COLOR_OPTIONS, COLOR_LABELS } from './WildColorPicker.constants';

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
  const { t } = useTranslation();
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
      className="fixed top-8 left-1/2 z-50 flex -translate-x-1/2 gap-4 rounded-2xl bg-white/80 px-6 py-4 backdrop-blur-sm max-lg:portrait:top-20 dark:bg-neutral-900/80"
      style={{
        opacity: springs.opacity,
        y: springs.y,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {COLOR_OPTIONS.map((c) => {
        const label = t(COLOR_LABELS[c.color]);
        return (
          <button
            key={label}
            aria-label={label}
            onClick={() => onColorSelect(c.color)}
            className="h-10 w-10 cursor-pointer rounded-full border-2 border-neutral-300 transition-transform hover:scale-110 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:border-white/20 dark:focus:ring-white/50"
            style={{ backgroundColor: c.hex }}
          />
        );
      })}
    </animated.div>
  );
};
