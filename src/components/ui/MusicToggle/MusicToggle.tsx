import { IconButton } from '@/components/ui/IconButton';
import { useTranslation } from '@/hooks/useTranslation';

type MusicToggleProps = {
  active: boolean;
  onClick: () => void;
};

export const MusicToggle = ({ active, onClick }: MusicToggleProps) => {
  const { t } = useTranslation();

  return (
    <IconButton
      ariaLabel={active ? t('toolbar.disableMusic') : t('toolbar.enableMusic')}
      tooltip={active ? t('toolbar.musicOn') : t('toolbar.musicOff')}
      onClick={onClick}
      active={active}
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
        {active ? (
          <>
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </>
        ) : (
          <>
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </>
        )}
      </svg>
    </IconButton>
  );
};
