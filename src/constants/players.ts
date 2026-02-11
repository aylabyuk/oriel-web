import type { AiPersonality } from '@/types/dialogue';

export const AI_NAMES: AiPersonality[] = ['Meio', 'Dong', 'Oscar'];
export const AI_NAME_SET = new Set<string>(AI_NAMES);
export const AVATAR_COLORS: Record<string, string> = {
  Meio: '#e74c3c',
  Dong: '#3498db',
  Oscar: '#2ecc71',
};
