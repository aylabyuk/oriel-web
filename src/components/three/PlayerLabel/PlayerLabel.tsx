import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { Seat } from '@/constants';
import { PULL_DISTANCE } from '@/components/three/PlayerHand/constants';

const AVATAR_COLORS: Record<string, string> = {
  Meio: '#e74c3c',
  Dong: '#3498db',
  Oscar: '#2ecc71',
};

const DEFAULT_COLOR = '#9b59b6';

type PlayerLabelProps = {
  name: string;
  seat: Seat;
  surfaceY: number;
  offsetY?: number;
  extraPull?: number;
  faceCenter?: boolean;
  tiltX?: number;
};

export const PlayerLabel = ({
  name,
  seat,
  surfaceY,
  offsetY = 1.6,
  extraPull = 0,
  faceCenter = false,
  tiltX = 0,
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

  return (
    <group position={position} rotation-x={tiltX} rotation-y={rotationY}>
      <Html center transform occlude scale={0.35}>
        <div className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-2.5 py-1 select-none pointer-events-none">
          <div
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: avatarColor }}
          >
            {initial}
          </div>
          <span className="whitespace-nowrap text-sm font-medium text-white">
            {name}
          </span>
        </div>
      </Html>
    </group>
  );
};
