import { useRef, useEffect } from 'react';
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

export const WelcomeScreen = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const name = useAppSelector(selectVisitorName);
  const company = useAppSelector(selectVisitorCompany);
  const nameError = useAppSelector(selectNameError);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      dispatch(setNameError(t('welcome.nameRequired')));
      dispatch(submitWelcome());
      nameInputRef.current?.focus();
      return;
    }

    dispatch(submitWelcome());
  };

  return (
    <section className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <Avatar src={MY_AVATAR_URL} alt="Oriel Absin" size="lg" className="mx-auto" />
          <h1 className="text-4xl font-bold tracking-tight">
            {t('welcome.title')}
          </h1>
          <p className="text-neutral-400">
            {t('welcome.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <Input
            ref={nameInputRef}
            label={t('welcome.nameLabel')}
            placeholder={t('welcome.namePlaceholder')}
            value={name}
            onChange={(e) => dispatch(setName(e.target.value))}
            error={nameError}
            required
            autoComplete="name"
          />
          <Input
            label={t('welcome.companyLabel')}
            placeholder={t('welcome.companyPlaceholder')}
            value={company}
            onChange={(e) => dispatch(setCompany(e.target.value))}
            autoComplete="organization"
          />
          <Button type="submit" className="w-full">
            {t('welcome.startButton')}
          </Button>
        </form>
      </div>
    </section>
  );
};
