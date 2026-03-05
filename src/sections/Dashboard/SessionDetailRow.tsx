import { useState } from 'react';
import type { SessionRow } from '@/types/dashboard';
import { cn } from '@/utils/cn';

type SessionDetailRowProps = {
  session: SessionRow;
  onDelete: (sessionId: string) => Promise<void>;
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

const RATING_COLORS = ['#ef6f6f', '#5b8ef5', '#4dcb7a', '#f0b84d', '#a855f7'];

const TrashIcon = () => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const DeleteButton = ({ onDelete }: { onDelete: () => Promise<void> }) => {
  const [deleting, setDeleting] = useState(false);

  const handleClick = async () => {
    if (!window.confirm('Delete this session?')) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={deleting}
      className="flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-400/10"
    >
      <TrashIcon />
      {deleting ? 'Deleting...' : 'Delete'}
    </button>
  );
};

const ExpandedDetails = ({
  session,
  topics,
  onDelete,
}: {
  session: SessionRow;
  topics: string[];
  onDelete: () => Promise<void>;
}) => (
  <div className="space-y-3">
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
    {session.feedback && session.feedback.length > 0 && (
      <div>
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Feedback ({session.feedback.length})
        </span>
        <div className="mt-1 space-y-3">
          {session.feedback.map((fb, idx) => (
            <div key={idx} className="space-y-1.5 border-l-2 border-neutral-200 pl-2 dark:border-neutral-700">
              {fb.rating > 0 && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'inline-block size-2.5 rounded-full',
                        i >= fb.rating &&
                          'bg-neutral-200 dark:bg-neutral-700',
                      )}
                      style={
                        i < fb.rating
                          ? { backgroundColor: RATING_COLORS[i] }
                          : undefined
                      }
                    />
                  ))}
                  <span className="ml-1 text-xs text-neutral-400">
                    {fb.rating}/5
                  </span>
                </div>
              )}
              {fb.message && (
                <p className="text-xs text-neutral-600 italic dark:text-neutral-300">
                  &ldquo;{fb.message}&rdquo;
                </p>
              )}
              {fb.email && (
                <p className="text-xs text-neutral-400">
                  {fb.email}
                </p>
              )}
            </div>
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
    <div className="flex justify-end">
      <DeleteButton onDelete={onDelete} />
    </div>
  </div>
);

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('inline transition-transform', expanded && 'rotate-90')}
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

/** Desktop table row — hidden on mobile */
export const SessionDetailRow = ({ session, onDelete }: SessionDetailRowProps) => {
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
          <ChevronIcon expanded={expanded} />
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-neutral-100 dark:border-neutral-800">
          <td colSpan={7} className="px-4 py-3">
            <ExpandedDetails session={session} topics={topics} onDelete={() => onDelete(session.sessionId)} />
          </td>
        </tr>
      )}
    </>
  );
};

/** Mobile card — hidden on desktop */
export const SessionDetailCard = ({ session, onDelete }: SessionDetailRowProps) => {
  const [expanded, setExpanded] = useState(false);

  const topics = session.events
    .filter((e) => e.type === 'topic_revealed')
    .map((e) => {
      const key = e.data?.topicKey;
      return typeof key === 'string' ? key : null;
    })
    .filter((t): t is string => t !== null);

  return (
    <div
      onClick={() => setExpanded((prev) => !prev)}
      className="cursor-pointer border-b border-neutral-100 px-4 py-3 transition-colors hover:bg-neutral-50/50 dark:border-neutral-800 dark:hover:bg-white/5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{session.visitorName}</span>
            <span className="text-sm">{session.isMobile ? '📱' : '🖥️'}</span>
          </div>
          <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {session.company ? `${session.company} · ` : ''}
            {session.country}
          </div>
        </div>
        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="text-sm tabular-nums">{formatDuration(session.durationMs)}</div>
            <div className="text-xs text-neutral-400">
              {session.gamesPlayed} {session.gamesPlayed === 1 ? 'game' : 'games'}
            </div>
          </div>
          <ChevronIcon expanded={expanded} />
        </div>
      </div>
      {expanded && (
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          <ExpandedDetails session={session} topics={topics} onDelete={() => onDelete(session.sessionId)} />
        </div>
      )}
    </div>
  );
};
