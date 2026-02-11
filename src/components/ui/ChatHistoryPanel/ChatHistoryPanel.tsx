import { useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { cn } from '@/utils/cn';
import type { AiPersonality, DialogueHistoryEntry } from '@/types/dialogue';

const AVATAR_COLORS: Record<AiPersonality, string> = {
  Meio: '#e74c3c',
  Dong: '#3498db',
  Oscar: '#2ecc71',
};

type ChatHistoryPanelProps = {
  open: boolean;
  history: DialogueHistoryEntry[];
};

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const ChatHistoryPanel = ({ open, history }: ChatHistoryPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const springs = useSpring({
    opacity: open ? 1 : 0,
    y: open ? 0 : 20,
    config: { tension: 260, friction: 22 },
  });

  useEffect(() => {
    if (!open || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history.length, open]);

  return (
    // @ts-expect-error animated.div children type mismatch with React 19
    <animated.div
      className={cn(
        'fixed bottom-14 right-4 z-60 flex w-64 flex-col sm:w-80',
        'rounded-2xl bg-neutral-900/80 shadow-xl backdrop-blur-sm',
        'border border-white/10',
      )}
      style={{
        opacity: springs.opacity,
        y: springs.y,
        pointerEvents: open ? 'auto' : 'none',
        maxHeight: '24rem',
      }}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 sm:px-4 sm:py-3">
        <span className="text-xs font-semibold text-white/90 sm:text-sm">Chat History</span>
        <span className="ml-auto text-[10px] text-white/40 sm:text-xs">{history.length} messages</span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto px-3 py-2 sm:space-y-3 sm:px-4 sm:py-3"
        style={{ maxHeight: '18rem' }}
      >
        {history.length === 0 ? (
          <p className="text-center text-xs italic text-white/30">
            No messages yet. AI dialogue will appear here.
          </p>
        ) : (
          history.map((entry, i) =>
            entry.kind === 'action' ? (
              <div key={`${entry.timestamp}-${i}`} className="flex items-center gap-2 py-0.5">
                <span className="text-[10px] text-white/40 sm:text-xs">
                  <span className="font-semibold text-white/60">{entry.playerName}</span>
                  {' '}{entry.message}
                </span>
                <span className="ml-auto shrink-0 text-[8px] text-white/20 sm:text-[10px]">
                  {formatTime(entry.timestamp)}
                </span>
              </div>
            ) : (
              <div key={`${entry.timestamp}-${i}`} className="flex items-start gap-2">
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
    </animated.div>
  );
};
