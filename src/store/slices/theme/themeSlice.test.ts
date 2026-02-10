import {
  themeSlice,
  setReducedMotion,
} from '@/store/slices/theme';

const reducer = themeSlice.reducer;

describe('themeSlice', () => {
  it('has the correct initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({
      reducedMotion: false,
    });
  });

  it('sets reduced motion', () => {
    const state = reducer(undefined, setReducedMotion(true));
    expect(state.reducedMotion).toBe(true);
  });
});
