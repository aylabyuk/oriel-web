import { useState } from 'react';
import type { GeoPoint } from '@/types/dashboard';
import { GlobeModal } from './GlobeModal';

type VisitorMapProps = {
  geoPoints: GeoPoint[];
};

export const VisitorMap = ({ geoPoints }: VisitorMapProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const hasData = geoPoints.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => hasData && setModalOpen(true)}
        disabled={!hasData}
        className="group w-full cursor-pointer rounded-2xl bg-white/80 p-5 text-left shadow-sm backdrop-blur-md transition-shadow hover:shadow-md dark:bg-neutral-900/80"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Visitors</h2>
          {hasData && (
            <span className="text-xs text-neutral-400 transition-colors group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
              Click to explore ↗
            </span>
          )}
        </div>

        {!hasData ? (
          <p className="py-8 text-center text-sm text-neutral-400">
            No location data yet
          </p>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6">
            {/* Globe icon */}
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-neutral-300 transition-colors group-hover:text-[#5b8ef5] dark:text-neutral-600 dark:group-hover:text-[#5b8ef5]"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              {/* Pulse dot */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ef6f6f] opacity-40" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-[#ef6f6f]" />
              </span>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {geoPoints.length}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {geoPoints.length === 1 ? 'location' : 'locations worldwide'}
              </p>
            </div>

            {/* Top countries preview */}
            <div className="flex flex-wrap justify-center gap-1.5">
              {geoPoints
                .slice(0, 5)
                .map((p) => {
                  const upper = p.countryCode.toUpperCase();
                  const flag =
                    upper.length === 2
                      ? String.fromCodePoint(
                          ...upper
                            .split('')
                            .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
                        )
                      : '';
                  return (
                    <span
                      key={`${p.city}-${p.countryCode}`}
                      className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                    >
                      {flag && <span className="mr-1">{flag}</span>}
                      {p.city}
                    </span>
                  );
                })}
              {geoPoints.length > 5 && (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  +{geoPoints.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </button>

      {modalOpen && (
        <GlobeModal
          geoPoints={geoPoints}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};
