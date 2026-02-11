import { IconButton } from '@/components/ui/IconButton';
import { useTranslation } from '@/hooks/useTranslation';

type ChatToggleProps = {
  open: boolean;
  onClick: () => void;
};

export const ChatToggle = ({ open, onClick }: ChatToggleProps) => {
  const { t } = useTranslation();

  return (
    <IconButton
      ariaLabel={open ? t('chat.closeLabel') : t('chat.openLabel')}
      tooltip={open ? t('chat.closeChat') : t('chat.openChat')}
      onClick={onClick}
      active={open}
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
        {open ? (
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        ) : (
          <>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </>
        )}
      </svg>
    </IconButton>
  );
};
