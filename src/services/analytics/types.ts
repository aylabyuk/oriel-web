import type { Timestamp } from 'firebase/firestore';
import type { GameEventType } from '@/types/game';

export type DeviceInfo = {
  userAgent: string;
  platform: string;
  language: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  pixelRatio: number;
  isMobile: boolean;
  isPWA: boolean;
  connectionType: string;
};

export type GeoInfo = {
  ip: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  timezone: string;
  lat: number;
  lon: number;
};

export type UIEventType =
  | 'game_started'
  | 'toggle_sound'
  | 'toggle_music'
  | 'toggle_chat'
  | 'toggle_free_look'
  | 'toggle_theme'
  | 'open_rules'
  | 'close_rules'
  | 'restart_game'
  | 'play_again'
  | 'wild_color_picked'
  | 'disclaimer_acknowledged';

export type AnalyticsEventType = GameEventType | UIEventType;

export const TRACK = {
  // Game events (from engine via Redux)
  CARD_PLAYED: 'card_played',
  CARD_DRAWN: 'card_drawn',
  PLAYER_PASSED: 'player_passed',
  DIRECTION_REVERSED: 'direction_reversed',
  PLAYER_SKIPPED: 'player_skipped',
  UNO_CALLED: 'uno_called',
  GAME_ENDED: 'game_ended',
  TURN_CHANGED: 'turn_changed',
  CHALLENGE_RESOLVED: 'challenge_resolved',
  UNO_PENALTY: 'uno_penalty',
  // UI events
  GAME_STARTED: 'game_started',
  TOGGLE_SOUND: 'toggle_sound',
  TOGGLE_MUSIC: 'toggle_music',
  TOGGLE_CHAT: 'toggle_chat',
  TOGGLE_FREE_LOOK: 'toggle_free_look',
  TOGGLE_THEME: 'toggle_theme',
  OPEN_RULES: 'open_rules',
  CLOSE_RULES: 'close_rules',
  RESTART_GAME: 'restart_game',
  PLAY_AGAIN: 'play_again',
  WILD_COLOR_PICKED: 'wild_color_picked',
  DISCLAIMER_ACKNOWLEDGED: 'disclaimer_acknowledged',
} as const satisfies Record<string, AnalyticsEventType>;

export type AnalyticsEvent = {
  type: AnalyticsEventType;
  timestamp: number;
  data?: Record<string, unknown>;
};

export type SessionDocument = {
  sessionId: string;
  visitorName: string;
  company: string;
  consentGiven: boolean;

  device: DeviceInfo;
  geo: GeoInfo | null;

  startedAt: Timestamp;
  lastActiveAt: Timestamp;
  durationMs: number;

  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;

  events: AnalyticsEvent[];
};
