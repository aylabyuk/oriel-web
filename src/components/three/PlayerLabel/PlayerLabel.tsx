import { useMemo } from 'react';
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

const TIMER_CSS = `
@property --timer-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes timer-trace {
  to { --timer-angle: 360deg; }
}`;

type PlayerLabelProps = {
  name: string;
  seat: Seat;
  surfaceY: number;
  offsetY?: number;
  extraPull?: number;
  faceCenter?: boolean;
  tiltX?: number;
  isActive?: boolean;
  activeColor?: string;
  turnId?: number;
  autoSort?: boolean;
  onToggleSort?: () => void;
  onUno?: () => void;
};

export const PlayerLabel = ({
  name,
  seat,
  surfaceY,
  offsetY = 1.6,
  extraPull = 0,
  faceCenter = false,
  tiltX = 0,
  isActive = false,
  activeColor,
  turnId = 0,
  autoSort = false,
  onToggleSort,
  onUno,
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

  const avatarColor = AVATAR_COLORS[name] ?? DEFAULT_COLOR;
  const initial = name.charAt(0).toUpperCase();
  const showTimer = isActive && activeColor;

  return (
    <group position={position} rotation-x={tiltX} rotation-y={rotationY}>
      <Html center transform occlude scale={0.35}>
        <style dangerouslySetInnerHTML={{ __html: TIMER_CSS }} />
        <div
          key={showTimer ? `active-${turnId}` : 'inactive'}
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
            {onToggleSort && (
              <button
                onClick={onToggleSort}
                className={`flex size-6 cursor-pointer items-center justify-center rounded-full transition-colors ${autoSort ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 2v12m0 0L1.5 11.5M4 14l2.5-2.5M12 14V2m0 0L9.5 4.5M12 2l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  {!autoSort && <line x1="1" y1="15" x2="15" y2="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
                </svg>
              </button>
            )}
            {onUno && (
              <button
                onClick={onUno}
                className="flex size-6 cursor-pointer items-center justify-center rounded-full bg-red-600 text-[8px] font-black leading-none text-white transition-colors hover:bg-red-500"
              >
                UNO
              </button>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
};
