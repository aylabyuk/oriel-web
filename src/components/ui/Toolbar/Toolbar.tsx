import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectSound,
  selectMusic,
  selectFreeLook,
  selectChat,
  toggleSound,
  toggleMusic,
  toggleFreeLook,
  toggleChat,
} from '@/store/slices/preferences';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { MusicToggle } from '@/components/ui/MusicToggle';
import { HelpButton } from '@/components/ui/HelpButton';
import { FreeLookToggle } from '@/components/ui/FreeLookToggle';
import { RestartButton } from '@/components/ui/RestartButton';
import { ChatToggle } from '@/components/ui/ChatToggle';
import { cn } from '@/utils/cn';

type ToolbarProps = {
  onRulesOpen: () => void;
  onRestartClick: () => void;
  restartDisabled: boolean;
};

export const Toolbar = ({
  onRulesOpen,
  onRestartClick,
  restartDisabled,
}: ToolbarProps) => {
  const dispatch = useAppDispatch();
  const soundOn = useAppSelector(selectSound);
  const musicOn = useAppSelector(selectMusic);
  const freeLook = useAppSelector(selectFreeLook);
  const chatOpen = useAppSelector(selectChat);

  return (
    <div
      className={cn(
        'fixed top-4 z-70 flex w-80 flex-row items-center justify-evenly',
        'rounded-full bg-neutral-100/70 px-1.5 py-1 backdrop-blur-sm',
        'dark:bg-neutral-900/70',
        'max-lg:portrait:left-1/2 max-lg:portrait:-translate-x-1/2',
        'lg:right-4 landscape:right-4',
      )}
    >
      <ThemeToggle />
      <SoundToggle active={soundOn} onClick={() => dispatch(toggleSound())} />
      <MusicToggle active={musicOn} onClick={() => dispatch(toggleMusic())} />
      <HelpButton onClick={onRulesOpen} />
      <FreeLookToggle active={freeLook} onClick={() => dispatch(toggleFreeLook())} />
      <RestartButton onClick={onRestartClick} disabled={restartDisabled} />
      <ChatToggle open={chatOpen} onClick={() => dispatch(toggleChat())} />
    </div>
  );
};
