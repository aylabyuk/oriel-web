import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAllSessions } from '@/services/analytics/sessionsReader';
import type { SessionDocument } from '@/services/analytics/types';
import type {
  DashboardData,
  DashboardStats,
  DailyActivity,
  GeoPoint,
  SessionRow,
  TimeRange,
} from '@/types/dashboard';

const toDate = (ts: unknown): Date => {
  if (ts && typeof ts === 'object' && 'toDate' in ts) {
    return (ts as { toDate: () => Date }).toDate();
  }
  return new Date();
};

const formatDateKey = (date: Date): string =>
  date.toISOString().slice(0, 10);

const getTimeRangeCutoff = (range: TimeRange): Date | null => {
  if (range === 'all') return null;

  const now = new Date();

  switch (range) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return d;
    }
    case 'year': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
  }
};

const computeStats = (sessions: SessionDocument[]): DashboardStats => {
  const totalVisitors = sessions.length;
  const totalDurationMs = sessions.reduce((sum, s) => sum + s.durationMs, 0);
  const totalGamesPlayed = sessions.reduce((sum, s) => sum + s.gamesPlayed, 0);
  const totalGamesWon = sessions.reduce((sum, s) => sum + s.gamesWon, 0);

  const allFeedback = sessions.flatMap((s) => s.feedback ?? []);
  const feedbackCount = allFeedback.length;
  const ratedFeedback = allFeedback.filter((f) => f.rating > 0);
  const avgRating =
    ratedFeedback.length > 0
      ? ratedFeedback.reduce((sum, f) => sum + f.rating, 0) / ratedFeedback.length
      : 0;

  return {
    totalVisitors,
    avgSessionDurationMs: totalVisitors > 0 ? totalDurationMs / totalVisitors : 0,
    totalGamesPlayed,
    overallWinRate: totalGamesPlayed > 0 ? (totalGamesWon / totalGamesPlayed) * 100 : 0,
    avgRating,
    feedbackCount,
  };
};

const computeDailyActivity = (sessions: SessionDocument[]): DailyActivity[] => {
  const countByDate = new Map<string, number>();

  for (const session of sessions) {
    const date = formatDateKey(toDate(session.startedAt));
    countByDate.set(date, (countByDate.get(date) ?? 0) + 1);
  }

  if (countByDate.size === 0) return [];

  const sortedDates = [...countByDate.keys()].sort();
  const start = new Date(sortedDates[0]);
  const end = new Date(sortedDates[sortedDates.length - 1]);
  const result: DailyActivity[] = [];

  const cursor = new Date(start);
  while (cursor <= end) {
    const key = formatDateKey(cursor);
    result.push({ date: key, visitors: countByDate.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
};

const computeGeoPoints = (sessions: SessionDocument[]): GeoPoint[] => {
  const grouped = new Map<string, GeoPoint>();

  for (const session of sessions) {
    if (!session.geo) continue;

    const key = `${session.geo.city}-${session.geo.countryCode}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.count += 1;
    } else {
      grouped.set(key, {
        lat: session.geo.lat,
        lon: session.geo.lon,
        city: session.geo.city,
        country: session.geo.country,
        countryCode: session.geo.countryCode,
        count: 1,
      });
    }
  }

  return [...grouped.values()];
};

const computeSessionRows = (sessions: SessionDocument[]): SessionRow[] =>
  sessions.map((s) => ({
    sessionId: s.sessionId,
    visitorName: s.visitorName,
    company: s.company,
    isMobile: s.device.isMobile,
    country: s.geo?.country ?? 'Unknown',
    city: s.geo?.city ?? 'Unknown',
    durationMs: s.durationMs,
    gamesPlayed: s.gamesPlayed,
    gamesWon: s.gamesWon,
    startedAt: toDate(s.startedAt),
    events: s.events,
    feedback: s.feedback,
  }));

const processData = (sessions: SessionDocument[]): DashboardData => ({
  stats: computeStats(sessions),
  dailyActivity: computeDailyActivity(sessions),
  geoPoints: computeGeoPoints(sessions),
  sessions: computeSessionRows(sessions),
});

type UseDashboardDataReturn = {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  refresh: () => void;
};

export const useDashboardData = (): UseDashboardDataReturn => {
  const [allSessions, setAllSessions] = useState<SessionDocument[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const sessions = await fetchAllSessions();
      setAllSessions(sessions);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load sessions';
      setError(message);
      console.error('[dashboard] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const data = useMemo(() => {
    if (!allSessions) return null;

    const cutoff = getTimeRangeCutoff(timeRange);

    const filtered = cutoff
      ? allSessions.filter((s) => toDate(s.startedAt) >= cutoff)
      : allSessions;

    return processData(filtered);
  }, [allSessions, timeRange]);

  return { data, loading, error, timeRange, setTimeRange, refresh: load };
};
