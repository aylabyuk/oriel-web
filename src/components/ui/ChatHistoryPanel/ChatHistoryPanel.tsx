import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { cn } from '@/utils/cn';
import type { DialogueHistoryEntry } from '@/types/dialogue';
import { useTranslation } from '@/hooks/useTranslation';
import { AVATAR_COLORS } from '@/constants/players';
import { TOPIC_LABELS, PERSONAL_INFO_TOPICS } from '@/data/personalInfoTopics';

type ChatHistoryPanelProps = {
  open: boolean;
  history: DialogueHistoryEntry[];
  onRequestInfo?: () => void;
};

type Tab = 'chat' | 'about';

const TOPIC_COUNT = PERSONAL_INFO_TOPICS.length;

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const TabSwitcher = ({
  tab,
  onTabChange,
  compact,
  aboutNewCount,
}: {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  compact?: boolean;
  aboutNewCount?: number;
}) => {
  const { t } = useTranslation();
  const showBadge = !!aboutNewCount && aboutNewCount > 0 && tab !== 'about';
  return (
    <div
      className={cn(
        'flex rounded-lg bg-neutral-200/60 p-0.5 dark:bg-white/10',
        compact ? 'gap-0.5' : 'gap-1',
      )}
    >
      {(['chat', 'about'] as const).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onTabChange(key)}
          className={cn(
            'relative cursor-pointer rounded-md px-2 py-1 text-[10px] font-medium transition-colors sm:text-xs',
            tab === key
              ? 'bg-white text-neutral-800 shadow-sm dark:bg-white/20 dark:text-white'
              : 'text-neutral-500 hover:text-neutral-700 dark:text-white/40 dark:hover:text-white/60',
          )}
        >
          {key === 'chat' ? t('chat.tabChat') : t('chat.tabAbout')}
          {key === 'about' && showBadge && (
            <span className="absolute -top-1.5 -right-2.5 flex min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 py-px text-[8px] leading-none font-bold text-white shadow-[0_0_6px_rgba(16,185,129,0.6)]">
              {aboutNewCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

type TopicMessage = { text: string; timestamp: number };

type DiscoveredTopic = {
  topicKey: string;
  label: string;
  messages: TopicMessage[];
  firstSeen: number;
};

const useDiscoveredTopics = (
  history: DialogueHistoryEntry[],
): DiscoveredTopic[] =>
  useMemo(() => {
    const topicMap = new Map<
      string,
      { messages: TopicMessage[]; firstSeen: number }
    >();

    for (const entry of history) {
      if (entry.kind !== 'dialogue' || !entry.topicKey) continue;
      const existing = topicMap.get(entry.topicKey);
      if (existing) {
        // Avoid duplicate messages (e.g. from game restart replaying same topic)
        if (!existing.messages.some((m) => m.text === entry.message)) {
          existing.messages.push({
            text: entry.message,
            timestamp: entry.timestamp,
          });
        }
      } else {
        topicMap.set(entry.topicKey, {
          messages: [{ text: entry.message, timestamp: entry.timestamp }],
          firstSeen: entry.timestamp,
        });
      }
    }

    return Array.from(topicMap.entries())
      .sort(([, a], [, b]) => a.firstSeen - b.firstSeen)
      .map(([key, data]) => ({
        topicKey: key,
        label: TOPIC_LABELS[key] ?? key,
        messages: data.messages,
        firstSeen: data.firstSeen,
      }));
  }, [history]);

const scrollbarClasses = cn(
  '[&::-webkit-scrollbar]:w-1.5',
  '[&::-webkit-scrollbar-track]:bg-transparent',
  '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-900/0 dark:[&::-webkit-scrollbar-thumb]:bg-white/0',
  '[&::-webkit-scrollbar-thumb]:transition-colors [&::-webkit-scrollbar-thumb]:duration-300',
  '[&:hover::-webkit-scrollbar-thumb]:bg-neutral-900/20 dark:[&:hover::-webkit-scrollbar-thumb]:bg-white/20',
  '[&:hover::-webkit-scrollbar-thumb:hover]:bg-neutral-900/40 dark:[&:hover::-webkit-scrollbar-thumb:hover]:bg-white/40',
);

const AboutMessages = ({
  history,
  lastSeenAt,
  onRequestInfo,
}: {
  history: DialogueHistoryEntry[];
  lastSeenAt: number;
  onRequestInfo?: () => void;
}) => {
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

const ChatMessages = ({
  history,
  maxHeight,
  showActions,
}: {
  history: DialogueHistoryEntry[];
  maxHeight?: string;
  showActions: boolean;
}) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => (showActions ? history : history.filter((e) => e.kind !== 'action')),
    [history, showActions],
  );

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

          const replyStyle =
            'ml-3 border-l-2 border-neutral-300/40 pl-2 dark:border-white/10';

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
          ) : isCompact ? (
            <div
              key={`${entry.timestamp}-${i}`}
              className={cn('flex items-start gap-2', spacing, replyStyle)}
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
              <div
                className={cn(
                  'flex items-start gap-2',
                  spacing,
                  isReply && replyStyle,
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

export const ChatHistoryPanel = ({
  open,
  history,
  onRequestInfo,
}: ChatHistoryPanelProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<Tab>('chat');
  const [showActions, setShowActions] = useState(false);
  const topics = useDiscoveredTopics(history);
  const lastSeenAtRef = useRef(0);
  // Snapshot of lastSeenAt captured when opening the About tab — used to render
  // NEW labels inside AboutMessages so they survive the badge-clearing update.
  const [aboutViewedAt, setAboutViewedAt] = useState(0);
  const aboutNewCount = topics.reduce(
    (sum, topic) =>
      sum +
      topic.messages.filter((m) => m.timestamp > lastSeenAtRef.current).length,
    0,
  );

  const handleTabChange = useCallback((next: Tab) => {
    setTab(next);
    if (next === 'about') {
      // Snapshot the old value for rendering NEW labels, then clear the badge
      setAboutViewedAt(lastSeenAtRef.current);
      lastSeenAtRef.current = Date.now();
    }
  }, []);

  // When already on the About tab and new messages arrive, update the snapshot
  // so newly arriving messages still show NEW labels, then clear the badge.
  useEffect(() => {
    if (tab === 'about' && aboutNewCount > 0) {
      setAboutViewedAt(lastSeenAtRef.current);
      lastSeenAtRef.current = Date.now();
    }
  }, [tab, aboutNewCount]);

  const handleToggleExpand = useCallback(
    () => setExpanded((prev) => !prev),
    [],
  );

  const springs = useSpring({
    x: open ? 0 : 340,
    portraitY: open ? 0 : 100,
    portraitHeight: expanded ? 85 : 25,
    config: { tension: 260, friction: 24 },
  });

  return (
    <>
      {/* Portrait mobile: bottom sheet (1/4 screen, expandable) */}
      {/* @ts-expect-error animated.div children type mismatch with React 19 */}
      <animated.div
        className={cn(
          'fixed inset-x-0 bottom-0 z-60 flex flex-col pb-4',
          'bg-white/80 shadow-xl backdrop-blur-sm dark:bg-neutral-900/80',
          'border-t border-neutral-200 dark:border-white/10',
          'lg:hidden landscape:hidden',
        )}
        style={{
          transform: springs.portraitY.to((v: number) => `translateY(${v}%)`),
          height: springs.portraitHeight.to((v: number) => `${v}vh`),
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 dark:border-white/10">
          <TabSwitcher
            tab={tab}
            onTabChange={handleTabChange}
            aboutNewCount={aboutNewCount}
            compact
          />
          {tab === 'chat' && (
            <button
              type="button"
              onClick={() => setShowActions((p) => !p)}
              className={cn(
                'rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors',
                showActions
                  ? 'bg-neutral-200/80 text-neutral-600 dark:bg-white/15 dark:text-white/60'
                  : 'text-neutral-400 hover:text-neutral-500 dark:text-white/25 dark:hover:text-white/40',
              )}
            >
              {t('chat.activityLog')}
            </button>
          )}
          <span className="ml-auto text-[10px] text-neutral-400 dark:text-white/40">
            {tab === 'chat'
              ? t('chat.messageCount', { count: history.length })
              : t('chat.progress', {
                  count: topics.length,
                  total: TOPIC_COUNT,
                })}
          </span>
        </div>
        {tab === 'chat' ? (
          <ChatMessages history={history} showActions={showActions} />
        ) : (
          <AboutMessages
            history={history}
            lastSeenAt={aboutViewedAt}
            onRequestInfo={onRequestInfo}
          />
        )}
        <button
          type="button"
          onClick={handleToggleExpand}
          className="mx-3 mt-1 rounded-lg border border-neutral-200 bg-neutral-100/60 px-3 py-1.5 text-[10px] font-medium text-neutral-500 transition-colors hover:bg-neutral-200/80 hover:text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white/80"
        >
          {expanded ? t('chat.collapse') : t('chat.expand')}
        </button>
      </animated.div>
      {/* Landscape + desktop: right-side panel */}
      {/* @ts-expect-error animated.div children type mismatch with React 19 */}
      <animated.div
        className={cn(
          'fixed top-16 right-4 bottom-6 z-60 flex w-64 flex-col sm:w-80',
          'rounded-2xl bg-white/80 shadow-xl backdrop-blur-sm dark:bg-neutral-900/80',
          'border border-neutral-200 dark:border-white/10',
          'hidden lg:flex landscape:flex',
        )}
        style={{
          x: springs.x,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 sm:px-4 sm:py-3 dark:border-white/10">
          <TabSwitcher
            tab={tab}
            onTabChange={handleTabChange}
            aboutNewCount={aboutNewCount}
          />
          {tab === 'chat' && (
            <button
              type="button"
              onClick={() => setShowActions((p) => !p)}
              className={cn(
                'rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors sm:text-[10px]',
                showActions
                  ? 'bg-neutral-200/80 text-neutral-600 dark:bg-white/15 dark:text-white/60'
                  : 'text-neutral-400 hover:text-neutral-500 dark:text-white/25 dark:hover:text-white/40',
              )}
            >
              {t('chat.activityLog')}
            </button>
          )}
          <span className="ml-auto text-[10px] text-neutral-400 sm:text-xs dark:text-white/40">
            {tab === 'chat'
              ? t('chat.messageCount', { count: history.length })
              : t('chat.progress', {
                  count: topics.length,
                  total: TOPIC_COUNT,
                })}
          </span>
        </div>
        {tab === 'chat' ? (
          <ChatMessages history={history} showActions={showActions} />
        ) : (
          <AboutMessages
            history={history}
            lastSeenAt={aboutViewedAt}
            onRequestInfo={onRequestInfo}
          />
        )}
      </animated.div>
    </>
  );
};
