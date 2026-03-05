import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DailyActivity } from '@/types/dashboard';

type ActivityChartProps = {
  data: DailyActivity[];
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const ActivityChart = ({ data }: ActivityChartProps) => (
  <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-md sm:p-5 dark:bg-neutral-900/80">
    <h2 className="mb-3 text-sm font-semibold sm:mb-4">Activity</h2>
    {data.length === 0 ? (
      <p className="py-8 text-center text-sm text-neutral-400">
        No activity data yet
      </p>
    ) : (
      <div className="h-[180px] sm:h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 0, left: -28 }}
        >
          <defs>
            <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5b8ef5" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#5b8ef5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 10 }}
            stroke="currentColor"
            opacity={0.4}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10 }}
            stroke="currentColor"
            opacity={0.4}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            labelFormatter={(label) => formatDate(String(label))}
            contentStyle={{
              background: 'rgba(0,0,0,0.8)',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              color: '#fff',
            }}
          />
          <Area
            type="monotone"
            dataKey="visitors"
            stroke="#5b8ef5"
            strokeWidth={2}
            fill="url(#colorVisitors)"
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    )}
  </div>
);
