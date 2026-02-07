import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CardColor } from '@/types/game';

type ThemeMode = 'light' | 'dark';

type ThemeState = {
  mode: ThemeMode;
  reducedMotion: boolean;
  accentColor: CardColor;
};

const initialState: ThemeState = {
  mode: 'dark',
  reducedMotion: false,
  accentColor: 'red',
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
    setAccentColor(state, action: PayloadAction<CardColor>) {
      state.accentColor = action.payload;
    },
  },
  selectors: {
    selectThemeMode: (state) => state.mode,
    selectReducedMotion: (state) => state.reducedMotion,
    selectAccentColor: (state) => state.accentColor,
  },
});

export const {
  setThemeMode,
  toggleThemeMode,
  setReducedMotion,
  setAccentColor,
} = themeSlice.actions;
export const { selectThemeMode, selectReducedMotion, selectAccentColor } =
  themeSlice.selectors;
