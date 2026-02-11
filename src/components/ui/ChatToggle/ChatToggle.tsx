import { cn } from '@/utils/cn';
import { useTranslation } from '@/hooks/useTranslation';

type ChatToggleProps = {
  open: boolean;
  onClick: () => void;
};

export const ChatToggle = ({ open, onClick }: ChatToggleProps) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      aria-label={open ? t('chat.closeLabel') : t('chat.openLabel')}
      data-tooltip={open ? t('chat.closeChat') : t('chat.openChat')}
      onClick={onClick}
      className={cn(
        'fixed right-4 bottom-4 z-60',
        'flex h-9 w-9 cursor-pointer items-center justify-center',
        'rounded-full text-lg shadow-sm backdrop-blur-sm transition-colors',
        'bg-white/60 hover:bg-white/80 dark:bg-black/60 dark:hover:bg-black/80',
        'focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:outline-none',
        'dark:focus:ring-neutral-500',
        open && 'ring-2 ring-neutral-400 dark:ring-neutral-500',
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
};
