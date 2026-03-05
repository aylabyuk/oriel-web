import { useRef, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setName,
  setCompany,
  setNameError,
  submitWelcome,
  selectVisitorName,
  selectVisitorCompany,
  selectNameError,
} from '@/store/slices/visitor';
import { useTranslation } from '@/hooks/useTranslation';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SocialLinks } from '@/components/ui/SocialLinks';
import { MY_AVATAR_URL } from '@/constants';
import { AI_NAME_SET, USERNAME_MAX_LENGTH } from '@/constants/players';
import { ADMIN_SECRET_NAME } from '@/constants/admin';
import { analytics } from '@/services/analytics';
import { cn } from '@/utils/cn';

type WelcomeScreenProps = {
  loading?: boolean;
  exiting?: boolean;
  onExited?: () => void;
  onSecretDetected?: () => void;
};

export const WelcomeScreen = ({
  loading = false,
  exiting = false,
  onExited,
  onSecretDetected,
}: WelcomeScreenProps) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  const name = useAppSelector(selectVisitorName);
  const company = useAppSelector(selectVisitorCompany);
  const nameError = useAppSelector(selectNameError);

  useEffect(() => {
    nameInputRef.current?.focus();
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const visible = mounted && !exiting;

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (
      exiting &&
      e.propertyName === 'opacity' &&
      e.target === e.currentTarget
    ) {
      onExited?.();
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      dispatch(setNameError(t('welcome.nameRequired')));
      nameInputRef.current?.focus();
      return;
    }
    if (AI_NAME_SET.has(trimmed)) {
      dispatch(setNameError(t('welcome.nameReserved')));
      nameInputRef.current?.focus();
      return;
    }
    if (trimmed.toLowerCase() === ADMIN_SECRET_NAME.toLowerCase()) {
      onSecretDetected?.();
      return;
    }

    dispatch(submitWelcome());
    analytics.setConsent(true);
    analytics.initialize({ name: trimmed, company: company.trim() });
  };

  return (
    <section className="flex h-svh items-center justify-center overflow-hidden px-4 py-6">
      {/* Glass card */}
      <div
        className={cn(
          'w-full max-w-md overflow-hidden rounded-3xl',
          'bg-white/80 shadow-xl backdrop-blur-md dark:bg-neutral-900/80',
          'transition-all duration-500 ease-out',
          'landscape:max-lg:max-w-2xl',
          visible
            ? 'scale-100 opacity-100'
            : 'scale-95 opacity-0',
        )}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* UNO gradient accent strip */}
        <div className="h-1 bg-gradient-to-r from-[#ef6f6f] via-[#5b8ef5] via-50% via-[#4dcb7a] to-[#f0b84d]" />

        {/* Content */}
        <div className="px-8 pt-8 pb-6">
          <div
            className={cn(
              'flex flex-col items-center gap-8',
              'landscape:max-lg:flex-row landscape:max-lg:items-center landscape:max-lg:gap-12',
            )}
          >
            {/* Avatar + Welcome */}
            <div
              className={cn(
                'space-y-5 text-center transition-all duration-500 ease-out',
                'landscape:max-lg:flex-1 landscape:max-lg:text-left',
                visible
                  ? 'translate-y-0 opacity-100'
                  : '-translate-y-6 opacity-0',
              )}
            >
              {/* Gradient ring around avatar */}
              <div
                className={cn(
                  'mx-auto inline-block rounded-full bg-gradient-to-br from-[#ef6f6f] via-[#5b8ef5] to-[#4dcb7a] p-[3px]',
                  'landscape:max-lg:mx-0',
                )}
              >
                <Avatar
                  src={MY_AVATAR_URL}
                  alt="Oriel Absin"
                  size="lg"
                  className="ring-0 landscape:max-lg:h-20 landscape:max-lg:w-20"
                />
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('welcome.title')}
              </h1>
              <p className="text-sm text-neutral-500 sm:text-base dark:text-neutral-400">
                {t('welcome.subtitle')}
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className={cn(
                'w-full space-y-5 transition-all delay-100 duration-500 ease-out sm:space-y-6',
                'landscape:max-lg:flex-1',
                visible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-6 opacity-0',
              )}
              noValidate
            >
              <Input
                ref={nameInputRef}
                label={t('welcome.nameLabel')}
                placeholder={t('welcome.namePlaceholder')}
                value={name}
                onChange={(e) => dispatch(setName(e.target.value))}
                error={nameError}
                required
                autoComplete="name"
                disabled={loading}
                maxLength={USERNAME_MAX_LENGTH}
              />
              <Input
                label={t('welcome.companyLabel')}
                placeholder={t('welcome.companyPlaceholder')}
                value={company}
                onChange={(e) => dispatch(setCompany(e.target.value))}
                autoComplete="organization"
                disabled={loading}
              />
              <Button
                type="submit"
                className="w-full cursor-pointer"
                loading={loading}
              >
                {t('welcome.startButton')}
              </Button>
            </form>
          </div>
        </div>

        {/* Social links footer */}
        <div className="border-t border-neutral-200 px-8 py-4 dark:border-white/10">
          <SocialLinks compact />
        </div>
      </div>
    </section>
  );
};
