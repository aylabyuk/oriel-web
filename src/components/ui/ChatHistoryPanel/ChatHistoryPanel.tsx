import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { cn } from '@/utils/cn';
import { useTranslation } from '@/hooks/useTranslation';
import type { ChatHistoryPanelProps, Tab } from './chatPanel.types';
import { TOPIC_COUNT } from './chatPanel.utils';
import { useDiscoveredTopics } from './useDiscoveredTopics';
import { SocialLinks } from '@/components/ui/SocialLinks';
import { TabSwitcher } from './TabSwitcher';
import { AboutMessages } from './AboutMessages';
import { ChatMessages } from './ChatMessages';

export const ChatHistoryPanel = ({
  open,
  history,
  onRequestInfo,
}: ChatHistoryPanelProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<Tab>('chat');
  const [showActions, setShowActions] = useState(true);
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
    portraitHeight: expanded ? 85 : 35,
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
        <div className="shrink-0 space-y-4 border-t border-neutral-200/60 px-3 pt-2 pb-1 dark:border-white/5">
          <button
            type="button"
            onClick={handleToggleExpand}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-100/60 px-3 py-1.5 text-[10px] font-medium text-neutral-500 transition-colors hover:bg-neutral-200/80 hover:text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white/80"
          >
            {expanded ? t('chat.collapse') : t('chat.expand')}
          </button>
          <SocialLinks compact />
        </div>
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
        <div className="shrink-0 border-t border-neutral-200/60 px-3 py-2 sm:px-4 dark:border-white/5">
          <SocialLinks compact />
        </div>
      </animated.div>
    </>
  );
};
