import { cn } from '@/utils/cn';
import { useTranslation } from '@/hooks/useTranslation';
import type { Tab } from './chatPanel.types';

type TabSwitcherProps = {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  compact?: boolean;
  aboutNewCount?: number;
};

export const TabSwitcher = ({
  tab,
  onTabChange,
  compact,
  aboutNewCount,
}: TabSwitcherProps) => {
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
