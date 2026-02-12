import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type ThemeMode = 'dark' | 'light';

type ThemeState = {
  mode: ThemeMode;
  reducedMotion: boolean;
};

const THEME_STORAGE_KEY = 'oriel-theme-mode';

const getStoredMode = (): ThemeMode => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage unavailable (SSR, private browsing, etc.)
  }
  return 'dark';
};

const initialState: ThemeState = {
  mode: getStoredMode(),
  reducedMotion: false,
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setReducedMotion(state, action: PayloadAction<boolean>) {
      state.reducedMotion = action.payload;
    },
    toggleMode(state) {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, state.mode);
      } catch {
        // localStorage unavailable
      }
    },
  },
  selectors: {
    selectReducedMotion: (state) => state.reducedMotion,
    selectMode: (state) => state.mode,
  },
});

export const { setReducedMotion, toggleMode } = themeSlice.actions;
export const { selectReducedMotion, selectMode } = themeSlice.selectors;
