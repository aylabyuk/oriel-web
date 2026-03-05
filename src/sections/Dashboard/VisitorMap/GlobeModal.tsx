import { useState, useEffect, useCallback, useRef } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import { useAppSelector } from '@/store/hooks';
import { selectMode } from '@/store/slices/theme';
import type { GeoPoint } from '@/types/dashboard';

type GlobeModalProps = {
  geoPoints: GeoPoint[];
  onClose: () => void;
};

const EARTH_IMG_LIGHT =
  '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
const EARTH_IMG_DARK =
  '//unpkg.com/three-globe/example/img/earth-night.jpg';
const BUMP_IMG = '//unpkg.com/three-globe/example/img/earth-topology.png';
const BG_IMG = '//unpkg.com/three-globe/example/img/night-sky.png';

const countryFlag = (code: string): string => {
  const upper = code.toUpperCase();
  if (upper.length !== 2) return '';
  return String.fromCodePoint(
    ...upper.split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
};

export const GlobeModal = ({ geoPoints, onClose }: GlobeModalProps) => {
  const mode = useAppSelector(selectMode);
  const isDark = mode === 'dark';
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const maxCount = Math.max(1, ...geoPoints.map((p) => p.count));

  // Fade in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Body scroll lock + escape key
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Measure container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      setDimensions({ width, height });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-rotate once globe is ready
  const handleGlobeReady = useCallback(() => {
    const controls = globeRef.current?.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
    }
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative mx-2 h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl transition-transform duration-300 sm:mx-4 sm:h-[90vh] sm:rounded-3xl ${
          visible ? 'scale-100' : 'scale-95'
        } ${isDark ? 'bg-[#0a0a1a]' : 'bg-[#050520]'}`}
      >
        {/* Header */}
        <div className="absolute top-0 right-0 left-0 z-20 flex items-center justify-between px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="text-sm font-semibold text-white sm:text-lg">Visitor Globe</h2>
            <span className="rounded-full bg-[#ef6f6f]/20 px-2 py-0.5 text-[10px] font-medium text-[#ef6f6f] sm:px-2.5 sm:text-xs">
              {geoPoints.length}{' '}
              {geoPoints.length === 1 ? 'location' : 'locations'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Globe container */}
        <div ref={containerRef} className="h-full w-full">
          {dimensions.width > 0 && (
            <Globe
              ref={globeRef}
              width={dimensions.width}
              height={dimensions.height}
              globeImageUrl={isDark ? EARTH_IMG_DARK : EARTH_IMG_LIGHT}
              bumpImageUrl={BUMP_IMG}
              backgroundImageUrl={BG_IMG}
              showAtmosphere={true}
              atmosphereColor={isDark ? '#ffffff' : '#3a82f7'}
              atmosphereAltitude={0.15}
              showGraticules={true}
              pointsData={geoPoints}
              pointLat="lat"
              pointLng="lon"
              pointColor={() => '#ef6f6f'}
              pointAltitude={(d) => {
                const p = d as GeoPoint;
                return 0.02 + (p.count / maxCount) * 0.15;
              }}
              pointRadius={(d) => {
                const p = d as GeoPoint;
                return 0.3 + (p.count / maxCount) * 0.9;
              }}
              pointLabel={(d) => {
                const p = d as GeoPoint;
                const flag = countryFlag(p.countryCode);
                return `
                  <div style="
                    background: rgba(15, 15, 30, 0.9);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 8px 12px;
                    font-family: system-ui, sans-serif;
                    color: white;
                    min-width: 120px;
                  ">
                    <div style="font-size: 13px; font-weight: 600;">
                      ${flag ? flag + ' ' : ''}${p.city}
                    </div>
                    <div style="font-size: 11px; color: #999; margin-top: 2px;">
                      ${p.country}
                    </div>
                    <div style="font-size: 12px; font-weight: 600; color: #ef6f6f; margin-top: 4px;">
                      ${p.count} ${p.count === 1 ? 'visitor' : 'visitors'}
                    </div>
                  </div>
                `;
              }}
              onGlobeReady={handleGlobeReady}
            />
          )}
        </div>

        {/* Hint */}
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-neutral-500 sm:bottom-4 sm:text-xs">
          Drag to rotate · Scroll to zoom
        </p>
      </div>
    </div>
  );
};
