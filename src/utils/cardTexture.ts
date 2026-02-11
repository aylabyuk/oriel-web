import { Value, Color } from 'uno-engine';
import { COLOR_PREFIX, VALUE_SUFFIX } from './cardTexture.constants';

/** Maps uno-engine Value + Color to the card image filename (e.g. 'red7.png') */
export const getCardFilename = (value: Value, color?: Color): string => {
  const isWild = value === Value.WILD || value === Value.WILD_DRAW_FOUR;

  if (isWild) {
    return `${VALUE_SUFFIX[value]}.png`;
  }

  if (color == null) {
    throw new Error(`Non-wild card (value=${value}) requires a color`);
  }

  return `${COLOR_PREFIX[color]}${VALUE_SUFFIX[value]}.png`;
};
