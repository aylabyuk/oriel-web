import { useEffect, useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import type { Seat } from '@/constants';
import type { DialogueBubble } from '@/types/dialogue';
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
}
@keyframes toast-up {
  0%   { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.6); }
  12%  { opacity: 1; transform: translateX(-50%) translateY(-2px) scale(1.05); }
  20%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  75%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.9); }
}
@keyframes toast-down {
  0%   { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.6); }
  12%  { opacity: 1; transform: translateX(-50%) translateY(2px) scale(1.05); }
  20%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  75%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  100% { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.9); }
}
@keyframes dialogue-bubble {
  0%   { opacity: 0; transform: translateY(4px) scale(0.85); }
  10%  { opacity: 1; transform: translateY(-1px) scale(1.02); }
  18%  { opacity: 1; transform: translateY(0) scale(1); }
  82%  { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-4px) scale(0.95); }
}`;

export type Toast = { message: string; color: string; key: number };

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
  dialogue?: DialogueBubble | null;
  dialogueAlign?: 'left' | 'right';
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
  dialogue,
  dialogueAlign,
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
              ...(faceCenter
                ? { top: '100%', marginTop: '8px' }
                : { bottom: '100%', marginBottom: '8px' }),
              animation: `${faceCenter ? 'toast-down' : 'toast-up'} 2s ease-out forwards`,
              backgroundColor: toast.color,
              boxShadow: `0 0 12px 3px ${toast.color}90`,
              pointerEvents: 'none' as const,
            }}
            className="whitespace-nowrap rounded-full px-3 py-1 text-sm font-bold text-white"
          >
            {toast.message}
          </div>
        )}
        {dialogue && (
          <div
            key={dialogue.key}
            style={{
              position: 'absolute',
              bottom: '100%',
              marginBottom: toast ? '48px' : '10px',
              ...(dialogueAlign === 'left'
                ? { right: '0', borderRight: `3px solid ${avatarColor}` }
                : { left: '0', borderLeft: `3px solid ${avatarColor}` }),
              animation: 'dialogue-bubble 3s ease-out forwards',
              backgroundColor: 'rgba(0,0,0,0.85)',
              pointerEvents: 'none' as const,
              width: '240px',
            }}
            className="whitespace-normal rounded-lg px-3 py-1.5 text-sm leading-snug font-medium text-white/90 italic"
          >
            {dialogue.message}
          </div>
        )}
        </div>
      </Html>
    </group>
  );
};
