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
  aboutHasNew,
}: {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  compact?: boolean;
  aboutHasNew?: boolean;
}) => {
  const { t } = useTranslation();
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
          {key === 'about' && aboutHasNew && tab !== 'about' && (
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

type DiscoveredTopic = {
  topicKey: string;
  label: string;
  messages: string[];
  firstSeen: number;
};

const useDiscoveredTopics = (
  history: DialogueHistoryEntry[],
): DiscoveredTopic[] =>
  useMemo(() => {
    const topicMap = new Map<
      string,
      { messages: string[]; firstSeen: number }
    >();

    for (const entry of history) {
      if (entry.kind !== 'dialogue' || !entry.topicKey) continue;
      const existing = topicMap.get(entry.topicKey);
      if (existing) {
        // Avoid duplicate messages (e.g. from game restart replaying same topic)
        if (!existing.messages.includes(entry.message)) {
          existing.messages.push(entry.message);
        }
      } else {
        topicMap.set(entry.topicKey, {
          messages: [entry.message],
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

const AboutMessages = ({ history }: { history: DialogueHistoryEntry[] }) => {
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
    <div
      ref={scrollRef}
      className={cn(
        'flex-1 space-y-3 overflow-y-auto px-3 py-2 sm:px-4 sm:py-3',
        scrollbarClasses,
      )}
    >
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-neutral-400 sm:text-xs dark:text-white/40">
          {t('chat.progress', { count: discoveredCount, total: TOPIC_COUNT })}
        </p>
      </div>

      {/* Discovered topics */}
      {topics.map((topic) => (
        <div
          key={topic.topicKey}
          className="border-l-2 border-emerald-500/50 pl-2.5 dark:border-emerald-400/40"
        >
          <p className="text-[11px] font-semibold text-neutral-700 sm:text-xs dark:text-white/80">
            {topic.label}
          </p>
          <ul className="mt-0.5 space-y-0.5">
            {topic.messages.map((msg, i) => (
              <li
                key={i}
                className="text-[10px] leading-snug text-neutral-500 sm:text-[11px] dark:text-white/50"
              >
                <span className="mr-1 text-neutral-300 dark:text-white/20">
                  &bull;
                </span>
                {msg}
              </li>
            ))}
          </ul>
        </div>
      ))}

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
  );
};

const ChatMessages = ({
  history,
  maxHeight,
}: {
  history: DialogueHistoryEntry[];
  maxHeight?: string;
}) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Defer so the DOM has painted the new content before we measure scrollHeight
    const id = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(id);
  }, [history]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        'flex-1 overflow-y-auto px-3 py-2 sm:px-4 sm:py-3',
        scrollbarClasses,
      )}
      style={maxHeight ? { maxHeight } : undefined}
    >
      {history.length === 0 ? (
        <p className="text-center text-xs text-neutral-400/60 italic dark:text-white/30">
          {t('chat.empty')}
        </p>
      ) : (
        history.map((entry, i) => {
          const prevEntry = history[i - 1];
          const nextEntry = history[i + 1];
          const tid = entry.kind === 'dialogue' ? entry.threadId : undefined;
          const prevTid =
            prevEntry?.kind === 'dialogue' ? prevEntry.threadId : undefined;
          const nextTid =
            nextEntry?.kind === 'dialogue' ? nextEntry.threadId : undefined;
          const isThreadContinuation = !!tid && tid === prevTid;
          const isThreadEnd = !!tid && tid !== nextTid;
          const spacing =
            i === 0 ? '' : isThreadContinuation ? 'mt-1' : 'mt-2 sm:mt-3';
          const threadBorder =
            tid && (isThreadContinuation || tid === nextTid)
              ? 'border-l-2 border-neutral-300/50 dark:border-white/10 ml-1 pl-2'
              : '';
          const threadEndRounding =
            isThreadEnd && !isThreadContinuation
              ? ''
              : isThreadEnd
                ? 'pb-0.5'
                : '';

          return entry.kind === 'shout' ? (
            <div
              key={`${entry.timestamp}-${i}`}
              className={cn('flex items-center gap-2 py-1', spacing)}
            >
              <span className="h-px flex-1 bg-red-500/30 dark:bg-red-400/30" />
              <span className="text-[11px] font-black tracking-widest text-red-600 sm:text-xs dark:text-red-400">
                {entry.playerName.toUpperCase()} — {entry.message}
              </span>
              <span className="h-px flex-1 bg-red-500/30 dark:bg-red-400/30" />
            </div>
          ) : entry.kind === 'action' ? (
            <div
              key={`${entry.timestamp}-${i}`}
              className={cn('flex items-center gap-2 py-0.5', spacing)}
            >
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
          ) : (
            <div
              key={`${entry.timestamp}-${i}`}
              className={cn(
                'flex items-start gap-2',
                spacing,
                threadBorder,
                threadEndRounding,
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
          );
        })
      )}
    </div>
  );
};

export const ChatHistoryPanel = ({ open, history }: ChatHistoryPanelProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<Tab>('chat');
  const topics = useDiscoveredTopics(history);
  const totalTopicMessages = topics.reduce(
    (sum, topic) => sum + topic.messages.length,
    0,
  );
  const seenMessagesRef = useRef(0);
  const aboutHasNew = totalTopicMessages > seenMessagesRef.current;

  const handleTabChange = useCallback(
    (next: Tab) => {
      setTab(next);
      if (next === 'about') {
        seenMessagesRef.current = totalTopicMessages;
      }
    },
    [totalTopicMessages],
  );

  // Also mark as seen if already on the About tab when new messages arrive
  useEffect(() => {
    if (tab === 'about') {
      seenMessagesRef.current = totalTopicMessages;
    }
  }, [tab, totalTopicMessages]);

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
            aboutHasNew={aboutHasNew}
            compact
          />
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
          <ChatMessages history={history} />
        ) : (
          <AboutMessages history={history} />
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
            aboutHasNew={aboutHasNew}
          />
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
          <ChatMessages history={history} />
        ) : (
          <AboutMessages history={history} />
        )}
      </animated.div>
    </>
  );
};
