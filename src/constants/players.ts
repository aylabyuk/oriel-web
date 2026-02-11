import type { AiPersonality } from '@/types/dialogue';

export const AI_NAMES: AiPersonality[] = ['Meio', 'Dong', 'Oscar'];
export const AI_NAME_SET = new Set<string>(AI_NAMES);
export const AVATAR_COLORS: Record<string, string> = {
  Meio: '#e74c3c',
  Dong: '#3498db',
  Oscar: '#2ecc71',
};

/** Append _v suffix if visitor name collides with an AI name */
export const sanitizeVisitorName = (name: string): string =>
  AI_NAME_SET.has(name) ? `${name}_v` : name;

/** Strip _v suffix added by sanitizeVisitorName for display purposes */
export const toDisplayName = (name: string): string => {
  if (!name.endsWith('_v')) return name;
  const base = name.slice(0, -2);
  return AI_NAME_SET.has(base) ? base : name;
};
