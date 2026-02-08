import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type EnvironmentPreset =
  | 'sunset'
  | 'dawn'
  | 'night'
  | 'city'
  | 'forest'
  | 'park';

type ThemeState = {
  environment: EnvironmentPreset;
  reducedMotion: boolean;
};

const initialState: ThemeState = {
  environment: 'sunset',
  reducedMotion: false,
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setEnvironment(state, action: PayloadAction<EnvironmentPreset>) {
      state.environment = action.payload;
    },
    setReducedMotion(state, action: PayloadAction<boolean>) {
      state.reducedMotion = action.payload;
    },
  },
  selectors: {
    selectEnvironment: (state) => state.environment,
    selectReducedMotion: (state) => state.reducedMotion,
  },
});

export const { setEnvironment, setReducedMotion } = themeSlice.actions;
export const { selectEnvironment, selectReducedMotion } = themeSlice.selectors;
