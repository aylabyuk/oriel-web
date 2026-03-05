import type { GeoInfo } from './types';

const GEO_API_URL = 'https://ipapi.co/json/';

type GeoApiResponse = {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  country_code: string;
  timezone: string;
  latitude: number;
  longitude: number;
};

const isGeoApiResponse = (data: unknown): data is GeoApiResponse => {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.ip === 'string' && typeof obj.country_name === 'string';
};

export const fetchGeoLocation = async (): Promise<GeoInfo | null> => {
  try {
    const response = await fetch(GEO_API_URL, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;

    const data: unknown = await response.json();
    if (!isGeoApiResponse(data)) return null;

    return {
      ip: data.ip,
      city: data.city,
      region: data.region,
      country: data.country_name,
      countryCode: data.country_code,
      timezone: data.timezone,
      lat: data.latitude,
      lon: data.longitude,
    };
  } catch {
    return null;
  }
};
