import {
  themeSlice,
  setThemeMode,
  toggleThemeMode,
  setReducedMotion,
  setAccentColor,
} from '@/store/slices/theme';

const reducer = themeSlice.reducer;

describe('themeSlice', () => {
  it('has the correct initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({
      mode: 'dark',
      reducedMotion: false,
      accentColor: 'red',
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

  it('sets accent color', () => {
    const state = reducer(undefined, setAccentColor('blue'));
    expect(state.accentColor).toBe('blue');
  });

  it('sets accent color to each UNO color', () => {
    for (const color of ['red', 'blue', 'green', 'yellow'] as const) {
      const state = reducer(undefined, setAccentColor(color));
      expect(state.accentColor).toBe(color);
    }
  });

  it('preserves other state when setting accent color', () => {
    const initial = reducer(undefined, setThemeMode('light'));
    const state = reducer(initial, setAccentColor('green'));
    expect(state.mode).toBe('light');
    expect(state.accentColor).toBe('green');
  });
});
