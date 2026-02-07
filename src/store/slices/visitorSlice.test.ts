import {
  visitorSlice,
  setName,
  setCompany,
  setNameError,
  submitWelcome,
  resetVisitor,
} from '@/store/slices/visitorSlice';

const reducer = visitorSlice.reducer;

describe('visitorSlice', () => {
  it('has the correct initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({
      name: '',
      company: '',
      nameError: '',
      submitted: false,
      hasEnteredWelcome: false,
    });
  });

  it('sets name', () => {
    const state = reducer(undefined, setName('Oriel'));
    expect(state.name).toBe('Oriel');
  });

  it('sets company', () => {
    const state = reducer(undefined, setCompany('Acme'));
    expect(state.company).toBe('Acme');
  });

  it('sets name error', () => {
    const state = reducer(undefined, setNameError('Required'));
    expect(state.nameError).toBe('Required');
  });

  it('clears name error when typing after submit', () => {
    let state = reducer(undefined, submitWelcome());
    expect(state.submitted).toBe(true);
    state = reducer(state, setNameError('Required'));
    state = reducer(state, setName('Oriel'));
    expect(state.nameError).toBe('');
  });

  it('does not clear name error before submit', () => {
    let state = reducer(undefined, setNameError('Required'));
    state = reducer(state, setName('Oriel'));
    expect(state.nameError).toBe('Required');
  });

  it('submits and enters welcome with valid name', () => {
    let state = reducer(undefined, setName('  Oriel  '));
    state = reducer(state, setCompany('  Acme  '));
    state = reducer(state, submitWelcome());
    expect(state.name).toBe('Oriel');
    expect(state.company).toBe('Acme');
    expect(state.submitted).toBe(true);
    expect(state.hasEnteredWelcome).toBe(true);
  });

  it('does not enter welcome with empty name', () => {
    const state = reducer(undefined, submitWelcome());
    expect(state.submitted).toBe(true);
    expect(state.hasEnteredWelcome).toBe(false);
  });

  it('resets to initial state', () => {
    let state = reducer(undefined, setName('Oriel'));
    state = reducer(state, submitWelcome());
    state = reducer(state, resetVisitor());
    expect(state).toEqual({
      name: '',
      company: '',
      nameError: '',
      submitted: false,
      hasEnteredWelcome: false,
    });
  });
});
