import { useEffect, useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import type { Seat } from '@/constants';
const PULL_DISTANCE = 1.2;

const AVATAR_COLORS: Record<string, string> = {
  Meio: '#e74c3c',
  Dong: '#3498db',
  Oscar: '#2ecc71',
};

const DEFAULT_COLOR = '#9b59b6';
const TURN_DURATION_S = 10;

const LABEL_CSS = `
@property --timer-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes timer-trace {
  to { --timer-angle: 360deg; }
}
@keyframes label-drop {
  0%   { opacity: 0; transform: translateY(-40px); }
  60%  { opacity: 1; transform: translateY(4px); }
  80%  { transform: translateY(-2px); }
  100% { opacity: 1; transform: translateY(0); }
@keyframes toast-up {
  0%   { opacity: 0; transform: translateY(8px); }
  15%  { opacity: 1; transform: translateY(0); }
  75%  { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-8px); }
}
@keyframes toast-down {
  0%   { opacity: 0; transform: translateY(-8px); }
  15%  { opacity: 1; transform: translateY(0); }
  75%  { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(8px); }
}`;

export type Toast = { message: string; key: number };

type PlayerLabelProps = {
  name: string;
  cardCount?: number;
  seat: Seat;
  surfaceY: number;
  offsetY?: number;
  extraPull?: number;
  faceCenter?: boolean;
  tiltX?: number;
  isActive?: boolean;
  activeColor?: string;
  toast?: Toast | null;
};

export const PlayerLabel = ({
  name,
  cardCount,
  seat,
  surfaceY,
  offsetY = 1.6,
  extraPull = 0,
  faceCenter = false,
  tiltX = 0,
  isActive = false,
  activeColor,
  toast,
}: PlayerLabelProps) => {
  const { position, rotationY } = useMemo(() => {
    const seatDist = Math.hypot(seat.position[0], seat.position[2]);
    const pullDirX = seat.position[0] / seatDist;
    const pullDirZ = seat.position[2] / seatDist;
    const pull = PULL_DISTANCE + extraPull;
    const base = Math.atan2(seat.position[0], seat.position[2]);

    return {
      position: [
        seat.position[0] + pullDirX * pull,
        surfaceY + offsetY,
        seat.position[2] + pullDirZ * pull,
      ] as [number, number, number],
      rotationY: faceCenter ? base : base + Math.PI,
    };
  }, [seat.position, surfaceY, offsetY, extraPull, faceCenter]);

  // Only play entrance animation on initial mount — not on subsequent re-renders
  const enteredRef = useRef(false);
  useEffect(() => { enteredRef.current = true; }, []);

  const avatarColor = AVATAR_COLORS[name] ?? DEFAULT_COLOR;
  const initial = name.charAt(0).toUpperCase();
  const showTimer = isActive && activeColor;

  return (
    <group position={position} rotation-x={tiltX} rotation-y={rotationY}>
      <Html center transform occlude scale={0.35}>
        <style dangerouslySetInnerHTML={{ __html: LABEL_CSS }} />
        <div style={{ position: 'relative', ...(!enteredRef.current ? { animation: 'label-drop 0.4s ease-out both' } : undefined) }}>
        <div
          key={showTimer ? 'active' : 'inactive'}
          className="rounded-full p-[5px] select-none transition-transform duration-300"
          style={showTimer ? {
            background: `conic-gradient(from -90deg, ${activeColor} var(--timer-angle), #404040 var(--timer-angle))`,
            animation: `timer-trace ${TURN_DURATION_S}s linear forwards`,
            boxShadow: `0 0 12px 4px ${activeColor}80`,
            transform: 'scale(1.15)',
          } : undefined}
        >
          <div className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-2.5 py-1">
            <div
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: avatarColor }}
            >
              {initial}
            </div>
            <span className="whitespace-nowrap text-sm font-medium text-white">
              {name}
            </span>
            {cardCount != null && (
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold leading-none text-white/80">
                {cardCount}
              </div>
            )}
          </div>
        </div>
        {toast && (
          <div
            key={toast.key}
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              ...(faceCenter
                ? { top: '100%', marginTop: '6px' }
                : { bottom: '100%', marginBottom: '6px' }),
              animation: `${faceCenter ? 'toast-down' : 'toast-up'} 2s ease-out forwards`,
              pointerEvents: 'none' as const,
            }}
            className="whitespace-nowrap rounded-full bg-neutral-900/90 px-2.5 py-0.5 text-xs font-bold text-white shadow-lg"
          >
            {toast.message}
          </div>
        )}
        </div>
      </Html>
    </group>
  );
};
