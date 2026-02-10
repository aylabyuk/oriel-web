import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type ThemeMode = 'dark' | 'light';

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
    setReducedMotion(state, action: PayloadAction<boolean>) {
      state.reducedMotion = action.payload;
    },
    toggleMode(state) {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
    },
  },
  selectors: {
    selectReducedMotion: (state) => state.reducedMotion,
    selectMode: (state) => state.mode,
  },
});

export const { setReducedMotion, toggleMode } = themeSlice.actions;
export const { selectReducedMotion, selectMode } = themeSlice.selectors;
