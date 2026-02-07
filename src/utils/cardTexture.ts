import { Value, Color } from 'uno-engine';

const COLOR_PREFIX: Record<number, string> = {
  [Color.RED]: 'red',
  [Color.BLUE]: 'blue',
  [Color.GREEN]: 'green',
  [Color.YELLOW]: 'yellow',
};

const VALUE_SUFFIX: Record<number, string> = {
  [Value.ZERO]: '0',
  [Value.ONE]: '1',
  [Value.TWO]: '2',
  [Value.THREE]: '3',
  [Value.FOUR]: '4',
  [Value.FIVE]: '5',
  [Value.SIX]: '6',
  [Value.SEVEN]: '7',
  [Value.EIGHT]: '8',
  [Value.NINE]: '9',
  [Value.DRAW_TWO]: 'DrawTwo',
  [Value.REVERSE]: 'Reverse',
  [Value.SKIP]: 'Skip',
  [Value.WILD]: 'wild',
  [Value.WILD_DRAW_FOUR]: 'drawFour',
};

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
