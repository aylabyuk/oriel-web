import { cn } from '@/utils/cn';
import type { TimeRange } from '@/types/dashboard';

type DashboardHeaderProps = {
  onBack: () => void;
  onRefresh: () => void;
  loading: boolean;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
};

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: 'week', label: '7d' },
  { value: 'month', label: '30d' },
  { value: 'year', label: '1y' },
  { value: 'all', label: 'All' },
];

export const DashboardHeader = ({
  onBack,
  onRefresh,
  loading,
  timeRange,
  onTimeRangeChange,
}: DashboardHeaderProps) => (
  <header className="sticky top-0 z-10 overflow-hidden rounded-2xl bg-white/80 shadow-sm backdrop-blur-md dark:bg-neutral-900/80">
    <div className="h-1 bg-gradient-to-r from-[#ef6f6f] via-[#5b8ef5] via-50% via-[#4dcb7a] to-[#f0b84d]" />
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
      >
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Time range filter */}
      <div className="order-last flex w-full items-center justify-center gap-1 rounded-full bg-neutral-100 p-1 dark:bg-neutral-800 sm:order-none sm:w-auto">
        {TIME_RANGE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onTimeRangeChange(value)}
            className={cn(
              'flex-1 rounded-full px-3 py-1 text-xs font-medium transition-all sm:flex-none',
              value === timeRange
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-400 dark:hover:text-white"
      >
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(loading && 'animate-spin')}
        >
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
        <span className="hidden sm:inline">Refresh</span>
      </button>
    </div>
  </header>
);
