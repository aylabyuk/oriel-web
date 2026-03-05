import { StatCard } from './StatCard';
import type { DashboardStats } from '@/types/dashboard';

type StatCardsRowProps = {
  stats: DashboardStats;
};

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

export const StatCardsRow = ({ stats }: StatCardsRowProps) => (
  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
    <StatCard label="Total Visitors" value={String(stats.totalVisitors)} />
    <StatCard
      label="Avg Duration"
      value={formatDuration(stats.avgSessionDurationMs)}
    />
    <StatCard
      label="Games Played"
      value={String(stats.totalGamesPlayed)}
    />
    <StatCard
      label="Win Rate"
      value={
        stats.totalGamesPlayed > 0
          ? `${stats.overallWinRate.toFixed(1)}%`
          : 'N/A'
      }
    />
  </div>
);
