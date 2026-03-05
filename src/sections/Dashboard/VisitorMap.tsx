import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';
import type { GeoPoint } from '@/types/dashboard';

type VisitorMapProps = {
  geoPoints: GeoPoint[];
};

const GEO_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const MAX_MARKER_SIZE = 12;
const MIN_MARKER_SIZE = 4;

export const VisitorMap = ({ geoPoints }: VisitorMapProps) => {
  const maxCount = Math.max(1, ...geoPoints.map((p) => p.count));

  return (
    <div className="rounded-2xl bg-white/80 p-5 shadow-sm backdrop-blur-md dark:bg-neutral-900/80">
      <h2 className="mb-4 text-sm font-semibold">Visitors</h2>
      {geoPoints.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">
          No location data yet
        </p>
      ) : (
        <ComposableMap
          projectionConfig={{ scale: 140 }}
          height={280}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rpiKey}
                  geography={geo}
                  fill="currentColor"
                  stroke="currentColor"
                  className="fill-neutral-200 stroke-neutral-300 dark:fill-neutral-800 dark:stroke-neutral-700"
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>
          {geoPoints.map((point) => {
            const size =
              MIN_MARKER_SIZE +
              ((point.count / maxCount) * (MAX_MARKER_SIZE - MIN_MARKER_SIZE));

            return (
              <Marker
                key={`${point.city}-${point.countryCode}`}
                coordinates={[point.lon, point.lat]}
              >
                <circle
                  r={size}
                  fill="#ef6f6f"
                  fillOpacity={0.7}
                  stroke="#ef6f6f"
                  strokeWidth={1}
                  strokeOpacity={0.3}
                />
                <title>
                  {point.city}, {point.country} ({point.count})
                </title>
              </Marker>
            );
          })}
        </ComposableMap>
      )}
    </div>
  );
};
