import { useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { cn } from '@/utils/cn';
import type { DialogueHistoryEntry } from '@/types/dialogue';
import { useTranslation } from '@/hooks/useTranslation';
import { AVATAR_COLORS } from '@/constants/players';

type ChatHistoryPanelProps = {
  open: boolean;
  history: DialogueHistoryEntry[];
  /** 'panel' = desktop floating overlay, 'drawer' = mobile inline drawer */
  variant?: 'panel' | 'drawer';
};

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatMessages = ({
  history,
  scrollRef,
  maxHeight,
}: {
  history: DialogueHistoryEntry[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  maxHeight?: string;
}) => {
  const { t } = useTranslation();

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
  variant = 'panel',
}: ChatHistoryPanelProps) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const springs = useSpring({
    x: open ? 0 : 340,
    config: { tension: 260, friction: 24 },
  });

  useEffect(() => {
    if (!open || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history.length, open]);

  if (variant === 'drawer') {
    return (
      <div
        className={cn(
          'fixed z-50 flex flex-col',
          'bg-neutral-900/80 shadow-xl backdrop-blur-sm',
          'transition-transform duration-300 ease-out',
          // Landscape: right-side panel
          'landscape:inset-y-0 landscape:right-0 landscape:w-72 landscape:border-l landscape:border-white/10 landscape:pt-14',
          // Portrait: bottom sheet
          'portrait:inset-x-0 portrait:bottom-0 portrait:h-48 portrait:border-t portrait:border-white/10',
          // Slide in/out
          open
            ? 'landscape:translate-x-0 portrait:translate-y-0'
            : 'landscape:translate-x-full portrait:translate-y-full',
        )}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <span className="text-xs font-semibold text-white/90">
            {t('chat.title')}
          </span>
          <span className="ml-auto text-[10px] text-white/40">
            {t('chat.messageCount', { count: history.length })}
          </span>
        </div>
        <ChatMessages history={history} scrollRef={scrollRef} />
      </div>
    );
  }

  return (
    // @ts-expect-error animated.div children type mismatch with React 19
    <animated.div
      className={cn(
        'fixed right-4 top-16 bottom-6 z-60 flex w-64 flex-col sm:w-80',
        'rounded-2xl bg-neutral-900/80 shadow-xl backdrop-blur-sm',
        'border border-white/10',
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

      <ChatMessages history={history} scrollRef={scrollRef} />
    </animated.div>
  );
};
