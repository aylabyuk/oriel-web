import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '@/store';
import type { RootState } from '@/store';
import { I18nProvider } from '@/i18n/I18nProvider';

export const renderWithProviders = (
  ui: React.ReactElement,
  {
    preloadedState,
    ...options
  }: { preloadedState?: Partial<RootState> } & Parameters<
    typeof render
  >[1] = {},
) => {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: preloadedState as RootState,
  });
  const result = render(
    <I18nProvider>
      <Provider store={store}>{ui}</Provider>
    </I18nProvider>,
    options,
  );
  return { ...result, store };
};
