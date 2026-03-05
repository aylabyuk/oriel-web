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

  const topics = session.events
    .filter((e) => e.type === 'topic_revealed')
    .map((e) => {
      const key = e.data?.topicKey;
      return typeof key === 'string' ? key : null;
    })
    .filter((t): t is string => t !== null);

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
          <td colSpan={7} className="px-4 py-3 space-y-3">
            {topics.length > 0 && (
              <div>
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Topics revealed
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {topics.map((topic) => (
                    <span
                      key={topic}
                      className="inline-block rounded-full bg-[#5b8ef5]/10 px-2.5 py-0.5 text-xs font-medium text-[#5b8ef5]"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Events
              </span>
              <div className="mt-1 flex flex-wrap gap-2">
                {session.events.length === 0 ? (
                  <span className="text-xs text-neutral-400">No events</span>
                ) : (
                  session.events.map((event, i) => {
                    const detail =
                      event.type === 'topic_revealed' && event.data?.topicKey
                        ? String(event.data.topicKey)
                        : event.type === 'link_clicked' && event.data?.url
                          ? String(event.data.url)
                          : null;

                    return (
                      <span
                        key={i}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs',
                          event.type === 'topic_revealed'
                            ? 'bg-[#5b8ef5]/10 text-[#5b8ef5]'
                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
                        )}
                      >
                        {detail ?? event.type}
                        <span className="text-neutral-400">
                          {formatEventTime(event.timestamp)}
                        </span>
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
