import { visitorSlice, setVisitorInfo, resetVisitor } from '@/store/slices/visitorSlice';

const reducer = visitorSlice.reducer;

describe('visitorSlice', () => {
  it('has the correct initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({
      name: '',
      company: '',
      hasEnteredWelcome: false,
    });
  });

  it('sets visitor info and marks welcome as entered', () => {
    const state = reducer(
      undefined,
      setVisitorInfo({ name: 'Oriel', company: 'Acme Corp' }),
    );
    expect(state.name).toBe('Oriel');
    expect(state.company).toBe('Acme Corp');
    expect(state.hasEnteredWelcome).toBe(true);
  });

  it('handles empty company', () => {
    const state = reducer(
      undefined,
      setVisitorInfo({ name: 'Oriel', company: '' }),
    );
    expect(state.name).toBe('Oriel');
    expect(state.company).toBe('');
    expect(state.hasEnteredWelcome).toBe(true);
  });

  it('resets to initial state', () => {
    const entered = reducer(
      undefined,
      setVisitorInfo({ name: 'Oriel', company: 'Acme' }),
    );
    const reset = reducer(entered, resetVisitor());
    expect(reset).toEqual({
      name: '',
      company: '',
      hasEnteredWelcome: false,
    });
  });
});
