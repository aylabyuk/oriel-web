import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { themeSlice } from '@/store/slices/themeSlice';
import { navigationSlice } from '@/store/slices/navigationSlice';

export const rootReducer = combineReducers({
  theme: themeSlice.reducer,
  navigation: navigationSlice.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
