import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { GameSnapshot, GameEvent, GamePhase } from '@/types/game';

type GameState = {
  snapshot: GameSnapshot | null;
  events: GameEvent[];
  phase: GamePhase;
};

const initialState: GameState = {
  snapshot: null,
  events: [],
  phase: 'idle',
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setSnapshot(state, action: PayloadAction<GameSnapshot>) {
      state.snapshot = action.payload;
      state.phase = action.payload.phase;
    },
    pushEvent(state, action: PayloadAction<GameEvent>) {
      state.events.push(action.payload);
    },
    clearEvents(state) {
      state.events = [];
    },
    resetGame() {
      return initialState;
    },
  },
  selectors: {
    selectSnapshot: (state) => state.snapshot,
    selectPhase: (state) => state.phase,
    selectEvents: (state) => state.events,
    selectCurrentPlayerName: (state) =>
      state.snapshot?.currentPlayerName ?? null,
    selectIsGameOver: (state) => state.phase === 'ended',
  },
});

export const { setSnapshot, pushEvent, clearEvents, resetGame } =
  gameSlice.actions;
export const {
  selectSnapshot,
  selectPhase,
  selectEvents,
  selectCurrentPlayerName,
  selectIsGameOver,
} = gameSlice.selectors;
