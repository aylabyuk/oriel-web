import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '@/store';
import type { RootState } from '@/store';

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState,
    ...options
  }: { preloadedState?: Partial<RootState> } & Parameters<typeof render>[1] = {},
) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: preloadedState as RootState,
  });
  return render(<Provider store={store}>{ui}</Provider>, options);
}
