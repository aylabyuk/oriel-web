import { useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';

type UnoButtonProps = {
  mode: 'shout' | 'catch' | null;
  targetName?: string;
  duration: number;
  onPress: () => void;
};

export const UnoButton = ({
  mode,
  targetName,
  duration,
  onPress,
}: UnoButtonProps) => {
  const open = mode !== null;
  const circleRef = useRef<SVGCircleElement>(null);
  const timerRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(
    null,
  );
  const startRef = useRef(0);

  const springs = useSpring({
    opacity: open ? 1 : 0,
    scale: open ? 1 : 0,
    config: open
      ? { tension: 300, friction: 18 }
      : { tension: 260, friction: 20 },
  });

  const pulseSpring = useSpring({
    from: { pulse: 1 },
    to: { pulse: 1.06 },
    loop: { reverse: true },
    pause: !open,
    config: { tension: mode === 'catch' ? 240 : 200, friction: 12 },
  });

  // Countdown ring animation via rAF
  useEffect(() => {
    if (!open || duration <= 0) return;
    const circle = circleRef.current;
    if (!circle) return;

    const circumference = 2 * Math.PI * 22;
    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = '0';
    startRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      circle.style.strokeDashoffset = `${circumference * progress}`;
      if (progress < 1) {
        timerRef.current = requestAnimationFrame(tick);
      }
    };
    timerRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [open, duration]);

  const label = mode === 'catch' ? `Catch ${targetName}!` : 'UNO!';
  const ariaLabel = mode === 'catch' ? `Catch ${targetName}` : 'Call UNO';
  const bgClass =
    mode === 'catch'
      ? 'bg-red-500 hover:bg-red-400'
      : 'bg-amber-500 hover:bg-amber-400';

  return (
    // @ts-expect-error animated.div children type mismatch with React 19
    <animated.div
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
      style={{
        opacity: springs.opacity,
        scale: pulseSpring.pulse,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {/* @ts-expect-error animated.button children type mismatch with React 19 */}
      <animated.button
        onClick={onPress}
        aria-label={ariaLabel}
        className={`relative cursor-pointer rounded-2xl px-8 py-3 text-lg font-extrabold text-white shadow-lg transition-colors focus:ring-2 focus:ring-white/50 focus:outline-none ${bgClass}`}
        style={{ scale: springs.scale }}
      >
        {label}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 50 50"
          preserveAspectRatio="none"
        >
          <circle
            ref={circleRef}
            cx="25"
            cy="25"
            r="22"
            fill="none"
            stroke="white"
            strokeOpacity="0.35"
            strokeWidth="2"
            strokeLinecap="round"
            transform="rotate(-90 25 25)"
          />
        </svg>
      </animated.button>
    </animated.div>
  );
};
