type StatCardProps = {
  label: string;
  value: string;
};

export const StatCard = ({ label, value }: StatCardProps) => (
  <div className="rounded-2xl bg-white/80 p-5 shadow-sm backdrop-blur-md dark:bg-neutral-900/80">
    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
      {label}
    </p>
    <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
  </div>
);
