export const USERNAME_MAX_LENGTH = 15;

export const AI_STRATEGIST = 'Meio' as const;
export const AI_TRASH_TALKER = 'Mark' as const;
export const AI_CHILL = 'Paul' as const;

export const AI_NAMES = [AI_STRATEGIST, AI_TRASH_TALKER, AI_CHILL] as const;
export type AiPersonality = (typeof AI_NAMES)[number];

export const AI_NAME_SET = new Set<string>(AI_NAMES);
export const AVATAR_COLORS: Record<string, string> = {
  [AI_STRATEGIST]: '#e74c3c',
  [AI_TRASH_TALKER]: '#3498db',
  [AI_CHILL]: '#2ecc71',
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
