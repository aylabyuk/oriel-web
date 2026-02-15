const COOKIE_NAME = 'oriel_shown_topics';
const EXPIRY_HOURS = 6;

export const readShownTopics = (): Set<string> => {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  if (!match) return new Set();
  try {
    const keys: unknown = JSON.parse(decodeURIComponent(match.split('=')[1]));
    return Array.isArray(keys) ? new Set(keys.filter((k): k is string => typeof k === 'string')) : new Set();
  } catch {
    return new Set();
  }
};

export const writeShownTopics = (keys: Set<string>): void => {
  const expires = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000).toUTCString();
  const value = encodeURIComponent(JSON.stringify([...keys]));
  document.cookie = `${COOKIE_NAME}=${value}; expires=${expires}; path=/; SameSite=Lax`;
};
