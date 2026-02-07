import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type VisitorState = {
  name: string;
  company: string;
  nameError: string;
  submitted: boolean;
  hasEnteredWelcome: boolean;
};

const initialState: VisitorState = {
  name: '',
  company: '',
  nameError: '',
  submitted: false,
  hasEnteredWelcome: false,
};

export const visitorSlice = createSlice({
  name: 'visitor',
  initialState,
  reducers: {
    setName(state, action: PayloadAction<string>) {
      state.name = action.payload;
      if (state.submitted && action.payload.trim()) {
        state.nameError = '';
      }
    },
    setCompany(state, action: PayloadAction<string>) {
      state.company = action.payload;
    },
    setNameError(state, action: PayloadAction<string>) {
      state.nameError = action.payload;
    },
    submitWelcome(state) {
      state.submitted = true;
      const trimmedName = state.name.trim();
      if (!trimmedName) return;
      state.name = trimmedName;
      state.company = state.company.trim();
      state.hasEnteredWelcome = true;
    },
    resetVisitor() {
      return initialState;
    },
  },
  selectors: {
    selectVisitorName: (state) => state.name,
    selectVisitorCompany: (state) => state.company,
    selectNameError: (state) => state.nameError,
    selectSubmitted: (state) => state.submitted,
    selectHasEnteredWelcome: (state) => state.hasEnteredWelcome,
  },
});

export const {
  setName,
  setCompany,
  setNameError,
  submitWelcome,
  resetVisitor,
} = visitorSlice.actions;
export const {
  selectVisitorName,
  selectVisitorCompany,
  selectNameError,
  selectSubmitted,
  selectHasEnteredWelcome,
} = visitorSlice.selectors;
