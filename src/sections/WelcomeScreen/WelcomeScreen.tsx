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
import { MY_AVATAR_URL } from '@/constants';
import { AI_NAME_SET } from '@/constants/players';
import { cn } from '@/utils/cn';

type WelcomeScreenProps = {
  loading?: boolean;
  exiting?: boolean;
  onExited?: () => void;
};

export const WelcomeScreen = ({
  loading = false,
  exiting = false,
  onExited,
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
    if (exiting && e.propertyName === 'opacity') {
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

    dispatch(submitWelcome());
  };

  return (
    <section className="flex min-h-svh items-center justify-center px-4 py-6">
      <div
        className={cn(
          'flex w-full max-w-md flex-col items-center gap-8',
          'landscape:max-lg:max-w-2xl landscape:max-lg:flex-row landscape:max-lg:items-center landscape:max-lg:gap-12',
        )}
      >
        {/* Section 1: Avatar + Welcome */}
        <div
          className={cn(
            'space-y-5 text-center transition-all duration-500 ease-out',
            'landscape:max-lg:flex-1 landscape:max-lg:text-left',
            visible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0',
          )}
          onTransitionEnd={handleTransitionEnd}
        >
          <Avatar
            src={MY_AVATAR_URL}
            alt="Oriel Absin"
            size="lg"
            className="mx-auto landscape:max-lg:mx-0 landscape:max-lg:h-20 landscape:max-lg:w-20"
          />
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('welcome.title')}
          </h1>
          <p className="text-sm text-neutral-500 sm:text-base dark:text-neutral-400">
            {t('welcome.subtitle')}
          </p>
        </div>

        {/* Section 2: Form */}
        <form
          onSubmit={handleSubmit}
          className={cn(
            'w-full space-y-5 transition-all delay-100 duration-500 ease-out sm:space-y-6',
            'landscape:max-lg:flex-1',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0',
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
    </section>
  );
};
