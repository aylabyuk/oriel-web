import { createSlice } from '@reduxjs/toolkit';

const PREFIX = 'oriel-pref-';

const readBool = (key: string, fallback: boolean): boolean => {
  try {
    const v = localStorage.getItem(PREFIX + key);
    if (v === 'true') return true;
    if (v === 'false') return false;
  } catch {
    // localStorage unavailable
  }
  return fallback;
};

const writeBool = (key: string, value: boolean): void => {
  try {
    localStorage.setItem(PREFIX + key, String(value));
  } catch {
    // localStorage unavailable
  }
};

type PreferencesState = {
  sound: boolean;
  music: boolean;
  freeLook: boolean;
  freeLookExplainerOpen: boolean;
  chat: boolean;
};

const initialState: PreferencesState = {
  sound: readBool('sound', true),
  music: readBool('music', true),
  freeLook: readBool('freeLook', false),
  freeLookExplainerOpen: false,
  chat: readBool('chat', true),
};

export const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    toggleSound(state) {
      state.sound = !state.sound;
      writeBool('sound', state.sound);
    },
    toggleMusic(state) {
      state.music = !state.music;
      writeBool('music', state.music);
    },
    toggleFreeLook(state) {
      state.freeLook = !state.freeLook;
      writeBool('freeLook', state.freeLook);
      if (state.freeLook) state.freeLookExplainerOpen = true;
    },
    dismissFreeLookExplainer(state) {
      state.freeLookExplainerOpen = false;
    },
    toggleChat(state) {
      state.chat = !state.chat;
      writeBool('chat', state.chat);
    },
  },
  selectors: {
    selectSound: (state) => state.sound,
    selectMusic: (state) => state.music,
    selectFreeLook: (state) => state.freeLook,
    selectFreeLookExplainerOpen: (state) => state.freeLookExplainerOpen,
    selectChat: (state) => state.chat,
  },
});

export const {
  toggleSound,
  toggleMusic,
  toggleFreeLook,
  dismissFreeLookExplainer,
  toggleChat,
} = preferencesSlice.actions;
export const {
  selectSound,
  selectMusic,
  selectFreeLook,
  selectFreeLookExplainerOpen,
  selectChat,
} = preferencesSlice.selectors;
