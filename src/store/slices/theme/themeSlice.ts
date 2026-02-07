import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type ThemeMode = 'light' | 'dark';

type ThemeState = {
  mode: ThemeMode;
  reducedMotion: boolean;
};

const initialState: ThemeState = {
  mode: 'dark',
  reducedMotion: false,
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
    },
    toggleThemeMode(state) {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
    },
    setReducedMotion(state, action: PayloadAction<boolean>) {
      state.reducedMotion = action.payload;
    },
  },
  selectors: {
    selectThemeMode: (state) => state.mode,
    selectReducedMotion: (state) => state.reducedMotion,
  },
});

export const { setThemeMode, toggleThemeMode, setReducedMotion } =
  themeSlice.actions;
export const { selectThemeMode, selectReducedMotion } = themeSlice.selectors;
