import { Value, Color } from 'uno-engine';

export const COLOR_PREFIX: Record<number, string> = {
  [Color.RED]: 'red',
  [Color.BLUE]: 'blue',
  [Color.GREEN]: 'green',
  [Color.YELLOW]: 'yellow',
};

export const VALUE_SUFFIX: Record<number, string> = {
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
