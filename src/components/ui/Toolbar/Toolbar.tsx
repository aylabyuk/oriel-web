import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { MusicToggle } from '@/components/ui/MusicToggle';
import { HelpButton } from '@/components/ui/HelpButton';
import { FreeLookToggle } from '@/components/ui/FreeLookToggle';
import { RestartButton } from '@/components/ui/RestartButton';
import { ChatToggle } from '@/components/ui/ChatToggle';
import { cn } from '@/utils/cn';

type ToolbarProps = {
  soundOn: boolean;
  onSoundToggle: () => void;
  musicOn: boolean;
  onMusicToggle: () => void;
  freeLook: boolean;
  onFreeLookToggle: () => void;
  chatOpen: boolean;
  onChatToggle: () => void;
  onRulesOpen: () => void;
  onRestartClick: () => void;
  restartDisabled: boolean;
};

export const Toolbar = ({
  soundOn,
  onSoundToggle,
  musicOn,
  onMusicToggle,
  freeLook,
  onFreeLookToggle,
  chatOpen,
  onChatToggle,
  onRulesOpen,
  onRestartClick,
  restartDisabled,
}: ToolbarProps) => (
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
    <SoundToggle active={soundOn} onClick={onSoundToggle} />
    <MusicToggle active={musicOn} onClick={onMusicToggle} />
    <HelpButton onClick={onRulesOpen} />
    <FreeLookToggle active={freeLook} onClick={onFreeLookToggle} />
    <RestartButton onClick={onRestartClick} disabled={restartDisabled} />
    <ChatToggle open={chatOpen} onClick={onChatToggle} />
  </div>
);
