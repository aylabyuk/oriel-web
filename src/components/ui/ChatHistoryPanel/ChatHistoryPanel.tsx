import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { cn } from '@/utils/cn';
import type { DialogueHistoryEntry } from '@/types/dialogue';
import { useTranslation } from '@/hooks/useTranslation';
import { AVATAR_COLORS } from '@/constants/players';

type ChatHistoryPanelProps = {
  open: boolean;
  history: DialogueHistoryEntry[];
};

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history.length]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        'flex-1 space-y-2 overflow-y-auto px-3 py-2 sm:space-y-3 sm:px-4 sm:py-3',
        '[&::-webkit-scrollbar]:w-1.5',
        '[&::-webkit-scrollbar-track]:bg-transparent',
        '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/0',
        '[&::-webkit-scrollbar-thumb]:transition-colors [&::-webkit-scrollbar-thumb]:duration-300',
        '[&:hover::-webkit-scrollbar-thumb]:bg-white/20',
        '[&:hover::-webkit-scrollbar-thumb:hover]:bg-white/40',
      )}
      style={maxHeight ? { maxHeight } : undefined}
    >
      {history.length === 0 ? (
        <p className="text-center text-xs text-white/30 italic">
          {t('chat.empty')}
        </p>
      ) : (
        history.map((entry, i) =>
          entry.kind === 'action' ? (
            <div
              key={`${entry.timestamp}-${i}`}
              className="flex items-center gap-2 py-0.5"
            >
              <span className="text-[10px] text-white/40 sm:text-xs">
                <span className="font-semibold text-white/60">
                  {entry.playerName}
                </span>{' '}
                {entry.message}
              </span>
              <span className="ml-auto shrink-0 text-[8px] text-white/20 sm:text-[10px]">
                {formatTime(entry.timestamp)}
              </span>
            </div>
          ) : (
            <div
              key={`${entry.timestamp}-${i}`}
              className="flex items-start gap-2"
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
                  <span className="text-[8px] text-white/30 sm:text-[10px]">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
                <p className="text-xs leading-snug text-white/80 sm:text-sm">
                  {entry.message}
                </p>
              </div>
            </div>
          ),
        )
      )}
    </div>
  );
};

export const ChatHistoryPanel = ({
  open,
  history,
}: ChatHistoryPanelProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
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
          'bg-neutral-900/80 shadow-xl backdrop-blur-sm',
          'border-t border-white/10',
          'lg:hidden landscape:hidden',
        )}
        style={{
          transform: springs.portraitY.to(
            (v: number) => `translateY(${v}%)`,
          ),
          height: springs.portraitHeight.to((v: number) => `${v}vh`),
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <span className="text-xs font-semibold text-white/90">
            {t('chat.title')}
          </span>
          <span className="ml-auto text-[10px] text-white/40">
            {t('chat.messageCount', { count: history.length })}
          </span>
        </div>
        <ChatMessages history={history} />
        <button
          type="button"
          onClick={handleToggleExpand}
          className="mx-3 mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white/80"
        >
          {expanded ? t('chat.collapse') : t('chat.expand')}
        </button>
      </animated.div>
      {/* Landscape + desktop: right-side panel */}
      {/* @ts-expect-error animated.div children type mismatch with React 19 */}
      <animated.div
        className={cn(
          'fixed right-4 top-16 bottom-6 z-60 flex w-64 flex-col sm:w-80',
          'rounded-2xl bg-neutral-900/80 shadow-xl backdrop-blur-sm',
          'border border-white/10',
          'hidden landscape:flex lg:flex',
        )}
        style={{
          x: springs.x,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 sm:px-4 sm:py-3">
          <span className="text-xs font-semibold text-white/90 sm:text-sm">
            {t('chat.title')}
          </span>
          <span className="ml-auto text-[10px] text-white/40 sm:text-xs">
            {t('chat.messageCount', { count: history.length })}
          </span>
        </div>
        <ChatMessages history={history} />
      </animated.div>
    </>
  );
};
