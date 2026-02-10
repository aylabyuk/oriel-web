import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type ThemeState = {
  reducedMotion: boolean;
};

const initialState: ThemeState = {
  reducedMotion: false,
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setReducedMotion(state, action: PayloadAction<boolean>) {
      state.reducedMotion = action.payload;
    },
  },
  selectors: {
    selectReducedMotion: (state) => state.reducedMotion,
  },
});

export const { setReducedMotion } = themeSlice.actions;
export const { selectReducedMotion } = themeSlice.selectors;
