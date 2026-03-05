import { DashboardHeader } from './DashboardHeader';
import { StatCardsRow } from './StatCardsRow';
import { ActivityChart } from './ActivityChart';
import { VisitorMap } from './VisitorMap';
import { SessionTable } from './SessionTable';
import { useDashboardData } from '@/hooks/useDashboardData';

type DashboardProps = {
  onBack: () => void;
};

export const Dashboard = ({ onBack }: DashboardProps) => {
  const { data, loading, error, timeRange, setTimeRange, refresh } =
    useDashboardData();

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6">
      <DashboardHeader
        onBack={onBack}
        onRefresh={refresh}
        loading={loading}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />

      {error && (
        <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-800 dark:border-neutral-600 dark:border-t-white" />
        </div>
      )}

      {data && (
        <>
          <StatCardsRow stats={data.stats} />
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <ActivityChart data={data.dailyActivity} />
            <VisitorMap geoPoints={data.geoPoints} />
          </div>
          <SessionTable sessions={data.sessions} />
        </>
      )}
    </div>
  );
};
