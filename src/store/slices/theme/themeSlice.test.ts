import {
  themeSlice,
  setThemeMode,
  toggleThemeMode,
  setReducedMotion,
} from '@/store/slices/theme';

const reducer = themeSlice.reducer;

describe('themeSlice', () => {
  it('has the correct initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({
      mode: 'dark',
      reducedMotion: false,
    });
  });

  it('sets theme mode', () => {
    const state = reducer(undefined, setThemeMode('light'));
    expect(state.mode).toBe('light');
  });

  it('toggles theme mode', () => {
    let state = reducer(undefined, toggleThemeMode());
    expect(state.mode).toBe('light');
    state = reducer(state, toggleThemeMode());
    expect(state.mode).toBe('dark');
  });

  it('sets reduced motion', () => {
    const state = reducer(undefined, setReducedMotion(true));
    expect(state.reducedMotion).toBe(true);
  });

  it('preserves other state when toggling theme mode', () => {
    const initial = reducer(undefined, setReducedMotion(true));
    const state = reducer(initial, toggleThemeMode());
    expect(state.mode).toBe('light');
    expect(state.reducedMotion).toBe(true);
  });
});
