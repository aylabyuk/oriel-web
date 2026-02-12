import { useState, useCallback } from 'react';

const PREFIX = 'oriel-pref-';

const readBool = (key: string, fallback: boolean): boolean => {
  try {
    const v = localStorage.getItem(PREFIX + key);
    if (v === 'true') return true;
    if (v === 'false') return false;
  } catch {
    // localStorage unavailable
  }
  return fallback;
};

const writeBool = (key: string, value: boolean): void => {
  try {
    localStorage.setItem(PREFIX + key, String(value));
  } catch {
    // localStorage unavailable
  }
};

export const usePersistedState = (
  key: string,
  fallback: boolean | (() => boolean),
): [boolean, () => void] => {
  const [value, setValue] = useState(() =>
    readBool(key, typeof fallback === 'function' ? fallback() : fallback),
  );

  const toggle = useCallback(() => {
    setValue((prev) => {
      const next = !prev;
      writeBool(key, next);
      return next;
    });
  }, [key]);

  return [value, toggle];
};
