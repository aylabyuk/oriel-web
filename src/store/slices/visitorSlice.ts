import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type VisitorState = {
  name: string;
  company: string;
  hasEnteredWelcome: boolean;
};

const initialState: VisitorState = {
  name: '',
  company: '',
  hasEnteredWelcome: false,
};

export const visitorSlice = createSlice({
  name: 'visitor',
  initialState,
  reducers: {
    setVisitorInfo(state, action: PayloadAction<{ name: string; company: string }>) {
      state.name = action.payload.name;
      state.company = action.payload.company;
      state.hasEnteredWelcome = true;
    },
    resetVisitor() {
      return initialState;
    },
  },
  selectors: {
    selectVisitorName: (state) => state.name,
    selectVisitorCompany: (state) => state.company,
    selectHasEnteredWelcome: (state) => state.hasEnteredWelcome,
  },
});

export const { setVisitorInfo, resetVisitor } = visitorSlice.actions;
export const { selectVisitorName, selectVisitorCompany, selectHasEnteredWelcome } =
  visitorSlice.selectors;
