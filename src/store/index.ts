import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { themeSlice } from '@/store/slices/theme';
import { navigationSlice } from '@/store/slices/navigation';
import { gameSlice } from '@/store/slices/game';
import { visitorSlice } from '@/store/slices/visitor';

export const rootReducer = combineReducers({
  theme: themeSlice.reducer,
  navigation: navigationSlice.reducer,
  game: gameSlice.reducer,
  visitor: visitorSlice.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
