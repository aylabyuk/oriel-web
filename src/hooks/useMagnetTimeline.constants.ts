import type { MagnetState } from '@/hooks/useMagnetState';

export const PLAY_INTERVAL = 300;

export const EMPTY_STATE: MagnetState = {
  deck: [],
  discardPile: [],
  discardFloat: [],
  playerFronts: [],
  playerStaging: [],
  playerHands: [],
  phase: 'idle',
  spreadProgress: 0,
  playingPlayerIndex: -1,
  selectedCardId: null,
  liftingCardId: null,
  direction: 'clockwise',
  currentPlayerName: null,
  drawFloat: [],
  drawingPlayerIndex: -1,
  drawInsertIndex: -1,
};
