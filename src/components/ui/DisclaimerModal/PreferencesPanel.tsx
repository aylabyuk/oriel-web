import { useTranslation } from '@/hooks/useTranslation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectSound,
  selectMusic,
  selectFreeLook,
  toggleSound,
  toggleMusic,
  toggleFreeLook,
} from '@/store/slices/preferences';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { MusicToggle } from '@/components/ui/MusicToggle';
import { FreeLookToggle } from '@/components/ui/FreeLookToggle';

export const PreferencesPanel = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const soundOn = useAppSelector(selectSound);
  const musicOn = useAppSelector(selectMusic);
  const freeLook = useAppSelector(selectFreeLook);

  return (
    <div className="rounded-xl bg-neutral-100/80 px-4 py-3 dark:bg-white/5">
      <p className="mb-3 text-center text-[10px] font-semibold tracking-wide text-neutral-400 uppercase dark:text-white/40">
        {t('disclaimer.preferences')}
      </p>
      <div className="flex items-stretch justify-center">
        <div className="flex w-16 flex-col items-center gap-1">
          <ThemeToggle />
          <span className="text-[10px] font-medium text-neutral-500 dark:text-white/50">
            {t('disclaimer.themeLabel')}
          </span>
        </div>
        <div className="flex w-16 flex-col items-center gap-1">
          <SoundToggle active={soundOn} onClick={() => dispatch(toggleSound())} />
          <span className="text-[10px] font-medium text-neutral-500 dark:text-white/50">
            {t('disclaimer.soundLabel')}
          </span>
        </div>
        <div className="flex w-16 flex-col items-center gap-1">
          <MusicToggle active={musicOn} onClick={() => dispatch(toggleMusic())} />
          <span className="text-[10px] font-medium text-neutral-500 dark:text-white/50">
            {t('disclaimer.musicLabel')}
          </span>
        </div>
        <div className="flex w-16 flex-col items-center gap-1">
          <FreeLookToggle active={freeLook} onClick={() => dispatch(toggleFreeLook())} />
          <span className="text-[10px] font-medium text-neutral-500 dark:text-white/50">
            {t('disclaimer.freeLookLabel')}
          </span>
        </div>
      </div>
    </div>
  );
};
