import { Color } from 'uno-engine';

export const UNO_COLORS: Record<number, string> = {
  [Color.RED]: '#ef6f6f',
  [Color.BLUE]: '#5b8ef5',
  [Color.GREEN]: '#4dcb7a',
  [Color.YELLOW]: '#f0b84d',
};

export const WILD_COLOR = '#ffffff';

export const unoColorToHex = (color: Color | undefined): string =>
  color != null ? (UNO_COLORS[color] ?? WILD_COLOR) : WILD_COLOR;
