import {
  visitorSlice,
  setName,
  setCompany,
  setNameError,
  submitWelcome,
  resetVisitor,
} from '@/store/slices/visitor';
import { USERNAME_MAX_LENGTH } from '@/constants/players';

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

  it('truncates name to USERNAME_MAX_LENGTH characters', () => {
    const longName = 'A'.repeat(USERNAME_MAX_LENGTH + 10);
    const state = reducer(undefined, setName(longName));
    expect(state.name).toBe('A'.repeat(USERNAME_MAX_LENGTH));
    expect(state.name).toHaveLength(USERNAME_MAX_LENGTH);
  });

  it('allows name at exactly USERNAME_MAX_LENGTH characters', () => {
    const exactName = 'A'.repeat(USERNAME_MAX_LENGTH);
    const state = reducer(undefined, setName(exactName));
    expect(state.name).toBe(exactName);
  });

  it('sets company', () => {
    const state = reducer(undefined, setCompany('Acme'));
    expect(state.company).toBe('Acme');
  });

  it('sets name error', () => {
    const state = reducer(undefined, setNameError('Required'));
    expect(state.nameError).toBe('Required');
  });

  it('clears name error when typing a valid name', () => {
    let state = reducer(undefined, setNameError('Required'));
    state = reducer(state, setName('Oriel'));
    expect(state.nameError).toBe('');
  });

  it('does not clear name error when typing whitespace only', () => {
    let state = reducer(undefined, setNameError('Required'));
    state = reducer(state, setName('   '));
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
