import { Value, Color } from 'uno-engine';
import { getCardFilename } from '@/utils/cardTexture';

describe('getCardFilename', () => {
  it('returns correct filename for number cards', () => {
    expect(getCardFilename(Value.ZERO, Color.BLUE)).toBe('blue0.png');
    expect(getCardFilename(Value.FIVE, Color.RED)).toBe('red5.png');
    expect(getCardFilename(Value.NINE, Color.YELLOW)).toBe('yellow9.png');
  });

  it('returns correct filename for action cards', () => {
    expect(getCardFilename(Value.SKIP, Color.RED)).toBe('redSkip.png');
    expect(getCardFilename(Value.REVERSE, Color.GREEN)).toBe(
      'greenReverse.png',
    );
    expect(getCardFilename(Value.DRAW_TWO, Color.BLUE)).toBe('blueDrawTwo.png');
  });

  it('returns correct filename for wild cards', () => {
    expect(getCardFilename(Value.WILD)).toBe('wild.png');
    expect(getCardFilename(Value.WILD_DRAW_FOUR)).toBe('drawFour.png');
  });

  it('ignores color for wild cards', () => {
    expect(getCardFilename(Value.WILD, Color.RED)).toBe('wild.png');
    expect(getCardFilename(Value.WILD_DRAW_FOUR, Color.BLUE)).toBe(
      'drawFour.png',
    );
  });

  it('throws for non-wild card without color', () => {
    expect(() => getCardFilename(Value.ZERO)).toThrow();
  });
});
