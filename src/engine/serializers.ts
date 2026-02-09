import type { Card } from 'uno-engine';
import type {
  SerializedCard,
  SerializedPlayer,
  PlayDirection,
} from '@/types/game';

let cardIdCounter = 0;
const cardIdMap = new WeakMap<Card, string>();

/** Get a stable unique ID for a Card instance */
export const getCardId = (card: Card): string => {
  let id = cardIdMap.get(card);
  if (!id) {
    id = `card-${cardIdCounter++}`;
    cardIdMap.set(card, id);
  }
  return id;
};

export const serializeCard = (card: Card): SerializedCard => ({
  value: card.value,
  color: card.color,
  id: getCardId(card),
});

export const serializePlayer = (
  player: { name: string; hand: Card[] },
): SerializedPlayer => ({
  name: player.name,
  cardCount: player.hand.length,
  hand: player.hand.map(serializeCard),
});

/** GameDirection.CLOCKWISE = 1, COUNTER_CLOCKWISE = 2 (enum not re-exported from uno-engine) */
export const serializeDirection = (direction: number): PlayDirection =>
  direction === 1 ? 'clockwise' : 'counter_clockwise';

/** Reset the card ID counter (useful for tests) */
export const resetCardIds = (): void => {
  cardIdCounter = 0;
};
