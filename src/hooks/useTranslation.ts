import { useContext, useCallback } from 'react';
import { I18nContext } from '@/i18n/context';
import type { TranslationKey, TranslationArgs } from '@/i18n/types';

export const useTranslation = () => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }

  const { translations } = context;

  const t = useCallback(
    <K extends TranslationKey>(key: K, ...args: TranslationArgs<K>): string => {
      const parts = key.split('.');
      let value: unknown = translations;

      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = (value as Record<string, unknown>)[part];
        } else {
          return key;
        }
      }

      if (typeof value !== 'string') {
        return key;
      }

      const params = args[0] as Record<string, string | number> | undefined;
      if (!params) {
        return value;
      }

      return value.replace(/\{\{(\w+)\}\}/g, (_, paramName: string) => {
        return String(params[paramName] ?? `{{${paramName}}}`);
      });
    },
    [translations],
  );

  return { t };
};
