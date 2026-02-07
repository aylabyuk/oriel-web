import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { themeSlice } from '@/store/slices/themeSlice';
import { navigationSlice } from '@/store/slices/navigationSlice';
import { gameSlice } from '@/store/slices/gameSlice';

export const rootReducer = combineReducers({
  theme: themeSlice.reducer,
  navigation: navigationSlice.reducer,
  game: gameSlice.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
