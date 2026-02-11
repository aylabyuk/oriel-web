import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { GameSnapshot, GameEvent } from '@/types/game';

type GameState = {
  snapshot: GameSnapshot | null;
  events: GameEvent[];
};

const initialState: GameState = {
  snapshot: null,
  events: [],
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setSnapshot(state, action: PayloadAction<GameSnapshot | null>) {
      state.snapshot = action.payload;
    },
    pushEvent(state, action: PayloadAction<GameEvent>) {
      state.events.push(action.payload);
    },
  },
  selectors: {
    selectSnapshot: (state) => state.snapshot,
    selectEvents: (state) => state.events,
  },
});

export const { setSnapshot, pushEvent } = gameSlice.actions;
export const { selectSnapshot, selectEvents } = gameSlice.selectors;
