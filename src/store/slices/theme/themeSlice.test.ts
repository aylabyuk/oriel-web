import { themeSlice, setReducedMotion, toggleMode } from '@/store/slices/theme';

const reducer = themeSlice.reducer;

describe('themeSlice', () => {
  it('has the correct initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({
      mode: 'dark',
      reducedMotion: false,
    });
  });

  it('sets reduced motion', () => {
    const state = reducer(undefined, setReducedMotion(true));
    expect(state.reducedMotion).toBe(true);
  });

  it('toggles mode between dark and light', () => {
    let state = reducer(undefined, { type: '@@INIT' });
    expect(state.mode).toBe('dark');
    state = reducer(state, toggleMode());
    expect(state.mode).toBe('light');
    state = reducer(state, toggleMode());
    expect(state.mode).toBe('dark');
  });
});
