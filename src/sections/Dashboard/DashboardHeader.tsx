import { cn } from '@/utils/cn';

type DashboardHeaderProps = {
  onBack: () => void;
  onRefresh: () => void;
  loading: boolean;
};

export const DashboardHeader = ({
  onBack,
  onRefresh,
  loading,
}: DashboardHeaderProps) => (
  <header className="sticky top-0 z-10 overflow-hidden rounded-2xl bg-white/80 shadow-sm backdrop-blur-md dark:bg-neutral-900/80">
    <div className="h-1 bg-gradient-to-r from-[#ef6f6f] via-[#5b8ef5] via-50% via-[#4dcb7a] to-[#f0b84d]" />
    <div className="flex items-center justify-between px-6 py-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
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
        Back
      </button>
      <h1 className="text-lg font-bold tracking-tight">
        Analytics Dashboard
      </h1>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-400 dark:hover:text-white"
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
        Refresh
      </button>
    </div>
  </header>
);
