import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { en } from '@/i18n/en';
import { I18nContext } from '@/i18n/context';
import type { I18nContextValue } from '@/i18n/context';
import type { Locale, Translations } from '@/i18n/types';

type I18nProviderProps = {
  locale?: Locale;
  children: ReactNode;
};

const translationsByLocale: Record<Locale, Translations> = {
  en,
};

export const I18nProvider = ({ locale = 'en', children }: I18nProviderProps) => {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      translations: translationsByLocale[locale],
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
