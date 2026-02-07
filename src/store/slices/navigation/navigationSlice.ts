import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type NavigationState = {
  activeSection: string;
  menuOpen: boolean;
};

const initialState: NavigationState = {
  activeSection: 'hero',
  menuOpen: false,
};

export const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setActiveSection(state, action: PayloadAction<string>) {
      state.activeSection = action.payload;
    },
    setMenuOpen(state, action: PayloadAction<boolean>) {
      state.menuOpen = action.payload;
    },
    toggleMenu(state) {
      state.menuOpen = !state.menuOpen;
    },
  },
  selectors: {
    selectActiveSection: (state) => state.activeSection,
    selectMenuOpen: (state) => state.menuOpen,
  },
});

export const { setActiveSection, setMenuOpen, toggleMenu } = navigationSlice.actions;
export const { selectActiveSection, selectMenuOpen } = navigationSlice.selectors;
