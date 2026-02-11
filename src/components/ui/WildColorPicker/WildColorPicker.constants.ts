import { Color } from 'uno-engine';

export const COLOR_OPTIONS = [
  { hex: '#ef6f6f', color: Color.RED },
  { hex: '#5b8ef5', color: Color.BLUE },
  { hex: '#4dcb7a', color: Color.GREEN },
  { hex: '#f0b84d', color: Color.YELLOW },
] as const;

export const COLOR_LABELS = {
  [Color.RED]: 'colors.red',
  [Color.BLUE]: 'colors.blue',
  [Color.GREEN]: 'colors.green',
  [Color.YELLOW]: 'colors.yellow',
} as const;
