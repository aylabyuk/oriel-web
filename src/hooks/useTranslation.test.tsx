import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nProvider } from '@/i18n/I18nProvider';
import { en } from '@/i18n/en';
import { useTranslation } from '@/hooks/useTranslation';

const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nProvider>{children}</I18nProvider>
);

describe('useTranslation', () => {
  it('returns the correct string for a simple key', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });
    expect(result.current.t('welcome.title')).toBe(en.welcome.title);
  });

  it('returns all welcome screen translations correctly', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });
    const { t } = result.current;

    expect(t('welcome.subtitle')).toBe(en.welcome.subtitle);
    expect(t('welcome.nameLabel')).toBe(en.welcome.nameLabel);
    expect(t('welcome.namePlaceholder')).toBe(en.welcome.namePlaceholder);
    expect(t('welcome.companyLabel')).toBe(en.welcome.companyLabel);
    expect(t('welcome.companyPlaceholder')).toBe(en.welcome.companyPlaceholder);
    expect(t('welcome.nameRequired')).toBe(en.welcome.nameRequired);
    expect(t('welcome.startButton')).toBe(en.welcome.startButton);
  });

  it('throws when used outside of I18nProvider', () => {
    expect(() => {
      renderHook(() => useTranslation());
    }).toThrow('useTranslation must be used within an I18nProvider');
  });
});
