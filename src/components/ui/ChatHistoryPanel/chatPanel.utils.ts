import { cn } from '@/utils/cn';
import { PERSONAL_INFO_TOPICS } from '@/data/personalInfoTopics';

export const TOPIC_COUNT = PERSONAL_INFO_TOPICS.length;

export const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const scrollbarClasses = cn(
  '[&::-webkit-scrollbar]:w-1.5',
  '[&::-webkit-scrollbar-track]:bg-transparent',
  '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-900/0 dark:[&::-webkit-scrollbar-thumb]:bg-white/0',
  '[&::-webkit-scrollbar-thumb]:transition-colors [&::-webkit-scrollbar-thumb]:duration-300',
  '[&:hover::-webkit-scrollbar-thumb]:bg-neutral-900/20 dark:[&:hover::-webkit-scrollbar-thumb]:bg-white/20',
  '[&:hover::-webkit-scrollbar-thumb:hover]:bg-neutral-900/40 dark:[&:hover::-webkit-scrollbar-thumb:hover]:bg-white/40',
);
