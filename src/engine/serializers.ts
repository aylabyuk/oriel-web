import type { Card } from 'uno-engine';
import type { SerializedCard, SerializedPlayer, PlayDirection } from '@/types/game';


let cardIdCounter = 0;
const cardIdMap = new WeakMap<Card, string>();

/** Get a stable unique ID for a Card instance */
export function getCardId(card: Card): string {
  let id = cardIdMap.get(card);
  if (!id) {
    id = `card-${cardIdCounter++}`;
    cardIdMap.set(card, id);
  }
  return id;
}

export function serializeCard(card: Card): SerializedCard {
  return {
    value: card.value,
    color: card.color,
    id: getCardId(card),
  };
}

export function serializePlayer(
  player: { name: string; hand: Card[] },
  revealHand: boolean,
): SerializedPlayer {
  return {
    name: player.name,
    cardCount: player.hand.length,
    hand: revealHand ? player.hand.map(serializeCard) : [],
  };
}

/** GameDirection.CLOCKWISE = 1, COUNTER_CLOCKWISE = 2 (enum not re-exported from uno-engine) */
export function serializeDirection(direction: number): PlayDirection {
  return direction === 1 ? 'clockwise' : 'counter_clockwise';
}

/** Reset the card ID counter (useful for tests) */
export function resetCardIds(): void {
  cardIdCounter = 0;
}
