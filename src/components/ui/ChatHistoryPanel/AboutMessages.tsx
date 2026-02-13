import { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import type { DialogueHistoryEntry } from '@/types/dialogue';
import { useTranslation } from '@/hooks/useTranslation';
import { useDiscoveredTopics } from './useDiscoveredTopics';
import { TOPIC_COUNT, scrollbarClasses } from './chatPanel.utils';

type AboutMessagesProps = {
  history: DialogueHistoryEntry[];
  lastSeenAt: number;
  onRequestInfo?: () => void;
};

export const AboutMessages = ({
  history,
  lastSeenAt,
  onRequestInfo,
}: AboutMessagesProps) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const topics = useDiscoveredTopics(history);
  const discoveredCount = topics.length;
  const undiscoveredCount = TOPIC_COUNT - discoveredCount;
  const totalMessages = topics.reduce((sum, t) => sum + t.messages.length, 0);
  const prevMessagesRef = useRef(totalMessages);

  // Auto-scroll when any new topic message arrives
  useEffect(() => {
    if (totalMessages > prevMessagesRef.current) {
      const el = scrollRef.current;
      if (el) {
        const id = requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
        prevMessagesRef.current = totalMessages;
        return () => cancelAnimationFrame(id);
      }
    }
    prevMessagesRef.current = totalMessages;
  }, [totalMessages]);

  if (discoveredCount === 0) {
    return (
      <div
        ref={scrollRef}
        className={cn(
          'flex flex-1 flex-col items-center justify-center px-4 py-6',
          scrollbarClasses,
        )}
      >
        <p className="text-center text-xs text-neutral-400/60 italic dark:text-white/30">
          {t('chat.aboutEmpty')}
        </p>
      </div>
    );
  }

  const pct = Math.round((discoveredCount / TOPIC_COUNT) * 100);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Progress bar — fixed above scroll area */}
      <div className="shrink-0 space-y-1 border-b border-neutral-200/60 px-3 py-2 sm:px-4 sm:py-2 dark:border-white/5">
        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-neutral-400 sm:text-xs dark:text-white/40">
            {t('chat.progress', { count: discoveredCount, total: TOPIC_COUNT })}
          </p>
          {onRequestInfo && undiscoveredCount > 0 && (
            <button
              type="button"
              onClick={onRequestInfo}
              className="cursor-pointer rounded px-1.5 py-0.5 text-[9px] font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 hover:text-emerald-700 sm:text-[10px] dark:text-emerald-400 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"
            >
              {t('chat.tellMeMore')}
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className={cn(
          'flex-1 space-y-3 overflow-y-auto px-3 py-2 sm:px-4 sm:py-3',
          scrollbarClasses,
        )}
      >
        {/* Discovered topics */}
        {topics.map((topic) => {
          const isNewTopic = topic.firstSeen > lastSeenAt;
          const hasNewMessages = topic.messages.some(
            (m) => m.timestamp > lastSeenAt,
          );
          return (
            <div
              key={topic.topicKey}
              className={cn(
                'border-l-2 pl-2.5',
                isNewTopic
                  ? 'border-emerald-500 dark:border-emerald-400'
                  : 'border-emerald-500/50 dark:border-emerald-400/40',
              )}
            >
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 sm:text-xs dark:text-white/80">
                {topic.label}
                {isNewTopic && (
                  <span className="rounded bg-emerald-500/15 px-1 py-px text-[8px] font-bold tracking-wide text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400">
                    NEW
                  </span>
                )}
              </p>
              <ul className="mt-0.5 space-y-0.5">
                {topic.messages.map((msg, i) => {
                  const isNew = !isNewTopic && msg.timestamp > lastSeenAt;
                  return (
                    <li
                      key={i}
                      className={cn(
                        'text-[10px] leading-snug sm:text-[11px]',
                        isNew || isNewTopic
                          ? 'text-neutral-700 dark:text-white/70'
                          : 'text-neutral-500 dark:text-white/50',
                      )}
                    >
                      <span className="mr-1 text-neutral-300 dark:text-white/20">
                        &bull;
                      </span>
                      {msg.text}
                      {isNew && hasNewMessages && (
                        <span className="ml-1 rounded bg-emerald-500/15 px-1 py-px text-[8px] font-bold tracking-wide text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400">
                          NEW
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {/* Undiscovered placeholders */}
        {undiscoveredCount > 0 &&
          Array.from({ length: undiscoveredCount }).map((_, i) => (
            <div
              key={`locked-${i}`}
              className="border-l-2 border-neutral-200 pl-2.5 dark:border-white/10"
            >
              <p className="text-[10px] text-neutral-400/50 italic sm:text-[11px] dark:text-white/20">
                {t('chat.undiscovered')}
              </p>
            </div>
          ))}
      </div>

    </div>
  );
};
