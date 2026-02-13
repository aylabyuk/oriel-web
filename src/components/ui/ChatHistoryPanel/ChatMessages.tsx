import { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/utils/cn';
import type { DialogueHistoryEntry } from '@/types/dialogue';
import { useTranslation } from '@/hooks/useTranslation';
import { AVATAR_COLORS } from '@/constants/players';
import { TOPIC_LABELS } from '@/data/personalInfoTopics';
import { formatTime, scrollbarClasses } from './chatPanel.utils';

type ChatMessagesProps = {
  history: DialogueHistoryEntry[];
  maxHeight?: string;
  showActions: boolean;
};

export const ChatMessages = ({
  history,
  maxHeight,
  showActions,
}: ChatMessagesProps) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const base = showActions
      ? history
      : history.filter((e) => e.kind !== 'action');

    // Collect all thread IDs so we can group their entries together
    const threadIds = new Set<string>();
    for (const e of base) {
      if (e.kind === 'dialogue' && e.threadId) {
        threadIds.add(e.threadId);
      }
    }
    if (threadIds.size === 0) return base;

    // Group thread entries together at the position of their first entry
    const result: DialogueHistoryEntry[] = [];
    const consumed = new Set<number>();

    for (let i = 0; i < base.length; i++) {
      if (consumed.has(i)) continue;
      const entry = base[i];
      const tid = entry.kind === 'dialogue' ? entry.threadId : undefined;

      if (tid && threadIds.has(tid)) {
        result.push(entry);
        consumed.add(i);
        for (let j = i + 1; j < base.length; j++) {
          const other = base[j];
          if (other.kind === 'dialogue' && other.threadId === tid) {
            result.push(other);
            consumed.add(j);
          }
        }
      } else {
        result.push(entry);
      }
    }

    return result;
  }, [history, showActions]);

  const infoThreadIds = useMemo(() => {
    const ids = new Set<string>();
    for (const e of filtered) {
      if (e.kind === 'dialogue' && e.topicKey && e.threadId) {
        ids.add(e.threadId);
      }
    }
    return ids;
  }, [filtered]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Defer so the DOM has painted the new content before we measure scrollHeight
    const id = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(id);
  }, [filtered]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        'flex-1 overflow-y-auto px-3 py-2 sm:px-4 sm:py-3',
        scrollbarClasses,
      )}
      style={maxHeight ? { maxHeight } : undefined}
    >
      {filtered.length === 0 ? (
        <p className="text-center text-xs text-neutral-400/60 italic dark:text-white/30">
          {t('chat.empty')}
        </p>
      ) : (
        filtered.map((entry, i) => {
          const tid = entry.kind === 'dialogue' ? entry.threadId : undefined;

          // Look past action/shout entries to find the previous dialogue
          let prevDialogue: DialogueHistoryEntry | undefined;
          for (let j = i - 1; j >= 0; j--) {
            if (filtered[j].kind === 'dialogue') {
              prevDialogue = filtered[j];
              break;
            }
          }
          const prevTid =
            prevDialogue?.kind === 'dialogue'
              ? prevDialogue.threadId
              : undefined;
          const isThreadContinuation = !!tid && tid === prevTid;

          // Discord-style: collapse header when same author follows itself in a thread
          const isSameAuthor =
            entry.kind === 'dialogue' &&
            prevDialogue?.kind === 'dialogue' &&
            entry.personality === prevDialogue.personality;
          const isCompact = isThreadContinuation && isSameAuthor;

          // Whether this dialogue is a reply (part of a thread but not the first)
          const isReply =
            entry.kind === 'dialogue' &&
            !!tid &&
            !isCompact &&
            isThreadContinuation;

          const isGroupStart = i > 0 && !isCompact && !isThreadContinuation;

          const spacing = isCompact
            ? 'mt-0.5'
            : isThreadContinuation
              ? 'mt-1'
              : '';

          const isInInfoThread =
            entry.kind === 'dialogue' && !!tid && infoThreadIds.has(tid);
          const hasTopicKey = entry.kind === 'dialogue' && !!entry.topicKey;
          let isFirstInfoInThread = false;
          if (hasTopicKey) {
            isFirstInfoInThread = true;
            for (let j = i - 1; j >= 0; j--) {
              const prev = filtered[j];
              if (
                prev.kind === 'dialogue' &&
                prev.threadId === tid &&
                prev.topicKey
              ) {
                isFirstInfoInThread = false;
                break;
              }
              if (prev.kind === 'dialogue' && prev.threadId !== tid) break;
            }
          }
          const topicLabel =
            isFirstInfoInThread && entry.kind === 'dialogue'
              ? TOPIC_LABELS[entry.topicKey!]
              : undefined;
          // Force full header when a topic label needs to render
          const showCompact = isCompact && !topicLabel;

          const replyStyle =
            'ml-3 border-l-2 border-neutral-300/40 pl-2 dark:border-white/10';
          const personalInfoBg =
            'rounded-md bg-gradient-to-r from-emerald-500/[0.07] via-emerald-500/[0.03] to-transparent px-2 py-1 dark:from-emerald-400/[0.08] dark:via-emerald-400/[0.03]';

          const separator = isGroupStart && (
            <div className="-mx-3 my-2 h-px bg-neutral-200/60 sm:-mx-4 sm:my-2.5 dark:bg-white/5" />
          );

          return entry.kind === 'shout' ? (
            <div key={`${entry.timestamp}-${i}`}>
              {separator}
              <div className={cn('flex items-center gap-2 py-1', spacing)}>
                <span className="h-px flex-1 bg-red-500/30 dark:bg-red-400/30" />
                <span className="text-[11px] font-black tracking-widest text-red-600 sm:text-xs dark:text-red-400">
                  {entry.playerName.toUpperCase()} — {entry.message}
                </span>
                <span className="h-px flex-1 bg-red-500/30 dark:bg-red-400/30" />
              </div>
            </div>
          ) : entry.kind === 'action' ? (
            <div key={`${entry.timestamp}-${i}`}>
              {separator}
              <div className={cn('flex items-center gap-2 py-0.5', spacing)}>
                <span className="text-[10px] text-neutral-500 sm:text-xs dark:text-white/40">
                  <span className="font-semibold text-neutral-700 dark:text-white/60">
                    {entry.playerName}
                  </span>{' '}
                  {entry.message}
                </span>
                <span className="ml-auto shrink-0 text-[8px] text-neutral-400 sm:text-[10px] dark:text-white/20">
                  {formatTime(entry.timestamp)}
                </span>
              </div>
            </div>
          ) : showCompact ? (
            <div
              key={`${entry.timestamp}-${i}`}
              className={cn(
                'flex items-start gap-2',
                spacing,
                !isInInfoThread && replyStyle,
                isInInfoThread && personalInfoBg,
              )}
            >
              {/* Invisible spacer matching avatar width */}
              <div className="size-5 shrink-0 sm:size-6" />
              <p className="min-w-0 flex-1 text-xs leading-snug text-neutral-700 sm:text-sm dark:text-white/80">
                {entry.message}
              </p>
            </div>
          ) : (
            <div key={`${entry.timestamp}-${i}`}>
              {separator}
              {topicLabel && (
                <span className="mb-3 inline-block rounded bg-emerald-500/15 px-1.5 py-px text-[10px] font-bold tracking-wide text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400">
                  {topicLabel}
                </span>
              )}
              <div
                className={cn(
                  'flex items-start gap-2',
                  spacing,
                  !isInInfoThread && isReply && replyStyle,
                  isInInfoThread && personalInfoBg,
                )}
              >
                <div
                  className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white sm:size-6 sm:text-[10px]"
                  style={{ backgroundColor: AVATAR_COLORS[entry.personality] }}
                >
                  {entry.personality.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-[10px] font-semibold sm:text-xs"
                      style={{ color: AVATAR_COLORS[entry.personality] }}
                    >
                      {entry.personality}
                    </span>
                    <span className="text-[8px] text-neutral-400 sm:text-[10px] dark:text-white/30">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs leading-snug text-neutral-700 sm:text-sm dark:text-white/80">
                    {entry.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
