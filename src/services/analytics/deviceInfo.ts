import type { DeviceInfo } from './types';

export const collectDeviceInfo = (): DeviceInfo => {
  const nav = navigator as unknown as Record<string, unknown>;
  const conn = nav.connection as Record<string, string> | undefined;

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: screen.width,
    screenHeight: screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio,
    isMobile:
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 0 && screen.width < 768),
    isPWA:
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && nav.standalone === true),
    connectionType: conn?.effectiveType ?? 'unknown',
  };
};
