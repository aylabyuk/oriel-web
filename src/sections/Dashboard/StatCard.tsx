type StatCardProps = {
  label: string;
  value: string;
};

export const StatCard = ({ label, value }: StatCardProps) => (
  <div className="rounded-2xl bg-white/80 p-3.5 shadow-sm backdrop-blur-md sm:p-5 dark:bg-neutral-900/80">
    <p className="text-[11px] font-medium text-neutral-500 sm:text-xs dark:text-neutral-400">
      {label}
    </p>
    <p className="mt-0.5 text-xl font-bold tracking-tight sm:mt-1 sm:text-2xl">
      {value}
    </p>
  </div>
);
