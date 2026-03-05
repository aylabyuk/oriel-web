import { useState } from 'react';
import type { SessionRow } from '@/types/dashboard';
import { SessionDetailRow, SessionDetailCard } from './SessionDetailRow';

type SessionTableProps = {
  sessions: SessionRow[];
  onDelete: (sessionId: string) => Promise<void>;
};

const PAGE_SIZE = 15;

export const SessionTable = ({ sessions, onDelete }: SessionTableProps) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const filtered = sessions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.visitorName.toLowerCase().includes(q) ||
      s.company.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = filtered.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE,
  );

  const emptyMessage = search ? 'No matching sessions' : 'No sessions yet';

  return (
    <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm backdrop-blur-md dark:bg-neutral-900/80">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 sm:px-5 sm:pt-5 sm:pb-3">
        <h2 className="text-sm font-semibold">
          Sessions{' '}
          <span className="font-normal text-neutral-400">
            ({filtered.length})
          </span>
        </h2>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search..."
          className="w-28 rounded-lg border border-neutral-200 bg-transparent px-3 py-1.5 text-xs outline-none transition-colors focus:border-neutral-400 sm:w-auto dark:border-neutral-700 dark:focus:border-neutral-500"
        />
      </div>

      {/* Desktop table — hidden on small screens */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[600px] text-left">
          <thead>
            <tr className="border-b border-neutral-200 text-xs font-medium text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Company</th>
              <th className="px-4 py-2 text-center">Device</th>
              <th className="px-4 py-2">Country</th>
              <th className="px-4 py-2">Duration</th>
              <th className="px-4 py-2 text-center">Games</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-neutral-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((session) => (
                <SessionDetailRow
                  key={session.sessionId}
                  session={session}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list — hidden on larger screens */}
      <div className="sm:hidden">
        {paginated.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-400">
            {emptyMessage}
          </p>
        ) : (
          paginated.map((session) => (
            <SessionDetailCard
              key={session.sessionId}
              session={session}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 border-t border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900 disabled:opacity-30 dark:text-neutral-400 dark:hover:text-white"
          >
            Previous
          </button>
          <span className="text-xs tabular-nums text-neutral-400">
            {safePage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900 disabled:opacity-30 dark:text-neutral-400 dark:hover:text-white"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
