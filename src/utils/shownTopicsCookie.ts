import { PERSONAL_INFO_TOPICS } from '@/data/personalInfoTopics';
import type { DialogueHistoryEntry } from '@/types/dialogue';

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

/** Reconstruct history entries for previously shown topics so the UI shows them after refresh. */
export const restoreShownHistory = (): DialogueHistoryEntry[] => {
  const shown = readShownTopics();
  if (shown.size === 0) return [];
  const entries: DialogueHistoryEntry[] = [];
  const baseTs = Date.now() - 1;
  let offset = 0;
  for (const topic of PERSONAL_INFO_TOPICS) {
    if (!shown.has(topic.topicKey)) continue;
    for (const entry of topic.entries) {
      entries.push({
        kind: 'dialogue',
        personality: entry.personality,
        message: entry.text,
        timestamp: baseTs + offset,
        topicKey: topic.topicKey,
        threadId: `restored-${topic.topicKey}`,
      });
      offset += 1;
    }
  }
  return entries;
};
