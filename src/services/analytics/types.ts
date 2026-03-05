import type { Timestamp } from 'firebase/firestore';

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

export type AnalyticsEventType =
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
  | 'disclaimer_acknowledged'
  | 'topic_revealed'
  | 'link_clicked'
  | 'feedback_submitted';

export type SessionFeedback = {
  rating: number;
  message: string;
  email: string;
  submittedAt: number;
};

export const TRACK = {
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
  DISCLAIMER_ACKNOWLEDGED: 'disclaimer_acknowledged',
  TOPIC_REVEALED: 'topic_revealed',
  LINK_CLICKED: 'link_clicked',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
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
  feedback?: SessionFeedback[];
  deletedAt?: Timestamp | null;
};
