import { createContext } from 'react';
import type { Locale, Translations } from '@/i18n/types';

export type I18nContextValue = {
  locale: Locale;
  translations: Translations;
};

export const I18nContext = createContext<I18nContextValue | null>(null);
