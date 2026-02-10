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
import { cn } from '@/utils/cn';

type WelcomeScreenProps = {
  loading?: boolean;
  exiting?: boolean;
  onExited?: () => void;
};

export const WelcomeScreen = ({ loading = false, exiting = false, onExited }: WelcomeScreenProps) => {
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
    dispatch(submitWelcome());

    if (!name.trim()) {
      dispatch(setNameError(t('welcome.nameRequired')));
      nameInputRef.current?.focus();
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div
          className={cn(
            'mb-32 space-y-7 text-center transition-all duration-500 ease-out',
            visible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0',
          )}
          onTransitionEnd={handleTransitionEnd}
        >
          <Avatar
            src={MY_AVATAR_URL}
            alt="Oriel Absin"
            size="lg"
            className="mx-auto"
          />
          <h1 className="text-4xl font-bold tracking-tight">
            {t('welcome.title')}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            {t('welcome.subtitle')}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={cn(
            'space-y-6 transition-all duration-500 ease-out delay-100',
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
          <Button type="submit" className="w-full cursor-pointer" loading={loading}>
            {t('welcome.startButton')}
          </Button>
        </form>
      </div>
    </section>
  );
};
