import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { GameSnapshot, GameEvent, GamePhase } from '@/types/game';

type GameState = {
  snapshot: GameSnapshot | null;
  events: GameEvent[];
  phase: GamePhase;
  tableReady: boolean;
};

const initialState: GameState = {
  snapshot: null,
  events: [],
  phase: 'idle',
  tableReady: false,
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setSnapshot(state, action: PayloadAction<GameSnapshot | null>) {
      state.snapshot = action.payload;
      state.phase = action.payload?.phase ?? 'idle';
    },
    pushEvent(state, action: PayloadAction<GameEvent>) {
      state.events.push(action.payload);
    },
    setTableReady(state) {
      state.tableReady = true;
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
    selectTableReady: (state) => state.tableReady,
    selectIsGameOver: (state) => state.phase === 'ended',
  },
});

export const { setSnapshot, pushEvent, setTableReady, clearEvents, resetGame } =
  gameSlice.actions;
export const {
  selectSnapshot,
  selectPhase,
  selectEvents,
  selectCurrentPlayerName,
  selectTableReady,
  selectIsGameOver,
} = gameSlice.selectors;
