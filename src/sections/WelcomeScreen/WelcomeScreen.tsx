import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setVisitorInfo } from '@/store/slices/visitorSlice';
import { useTranslation } from '@/hooks/useTranslation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const WelcomeScreen = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [nameError, setNameError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(t('welcome.nameRequired'));
      nameInputRef.current?.focus();
      return;
    }

    dispatch(setVisitorInfo({ name: trimmedName, company: company.trim() }));
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (submitted && value.trim()) {
      setNameError('');
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
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
            onChange={(e) => handleNameChange(e.target.value)}
            error={nameError}
            required
            autoComplete="name"
          />
          <Input
            label={t('welcome.companyLabel')}
            placeholder={t('welcome.companyPlaceholder')}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
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
