import { useState } from 'react';
import type { SessionRow } from '@/types/dashboard';
import { cn } from '@/utils/cn';

type SessionDetailRowProps = {
  session: SessionRow;
};

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

const formatEventTime = (ms: number): string => {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m${seconds}s` : `${seconds}s`;
};

export const SessionDetailRow = ({ session }: SessionDetailRowProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        onClick={() => setExpanded((prev) => !prev)}
        className="cursor-pointer border-b border-neutral-100 transition-colors hover:bg-neutral-50/50 dark:border-neutral-800 dark:hover:bg-white/5"
      >
        <td className="px-4 py-3 text-sm font-medium">{session.visitorName}</td>
        <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
          {session.company || '—'}
        </td>
        <td className="px-4 py-3 text-center text-sm">
          {session.isMobile ? '📱' : '🖥️'}
        </td>
        <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
          {session.country}
        </td>
        <td className="px-4 py-3 text-sm tabular-nums">
          {formatDuration(session.durationMs)}
        </td>
        <td className="px-4 py-3 text-center text-sm tabular-nums">
          {session.gamesPlayed}
        </td>
        <td className="px-4 py-3 text-center text-sm">
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'inline transition-transform',
              expanded && 'rotate-90',
            )}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-neutral-100 dark:border-neutral-800">
          <td colSpan={7} className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {session.events.length === 0 ? (
                <span className="text-xs text-neutral-400">No events</span>
              ) : (
                session.events.map((event, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {event.type}
                    <span className="text-neutral-400">
                      {formatEventTime(event.timestamp)}
                    </span>
                  </span>
                ))
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
