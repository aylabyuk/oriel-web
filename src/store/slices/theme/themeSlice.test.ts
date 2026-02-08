import {
  themeSlice,
  setEnvironment,
  setReducedMotion,
} from '@/store/slices/theme';

const reducer = themeSlice.reducer;

describe('themeSlice', () => {
  it('has the correct initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({
      environment: 'sunset',
      reducedMotion: false,
    });
  });

  it('sets environment preset', () => {
    const state = reducer(undefined, setEnvironment('night'));
    expect(state.environment).toBe('night');
  });

  it('sets reduced motion', () => {
    const state = reducer(undefined, setReducedMotion(true));
    expect(state.reducedMotion).toBe(true);
  });

  it('preserves other state when changing environment', () => {
    const initial = reducer(undefined, setReducedMotion(true));
    const state = reducer(initial, setEnvironment('forest'));
    expect(state.environment).toBe('forest');
    expect(state.reducedMotion).toBe(true);
  });
});
