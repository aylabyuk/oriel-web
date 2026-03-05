import type { AnalyticsEvent } from '@/services/analytics/types';

export type DashboardStats = {
  totalVisitors: number;
  avgSessionDurationMs: number;
  totalGamesPlayed: number;
  overallWinRate: number;
};

export type DailyActivity = {
  date: string;
  visitors: number;
};

export type GeoPoint = {
  lat: number;
  lon: number;
  city: string;
  country: string;
  countryCode: string;
  count: number;
};

export type SessionRow = {
  sessionId: string;
  visitorName: string;
  company: string;
  isMobile: boolean;
  country: string;
  city: string;
  durationMs: number;
  gamesPlayed: number;
  gamesWon: number;
  startedAt: Date;
  events: AnalyticsEvent[];
};

export type DashboardData = {
  stats: DashboardStats;
  dailyActivity: DailyActivity[];
  geoPoints: GeoPoint[];
  sessions: SessionRow[];
};
