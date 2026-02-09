import type { MagnetState } from '@/hooks/useMagnetState';
import type { CardPlacement } from '@/utils/zoneLayout';
import type { SerializedCard } from '@/types/game';
import type { Seat } from '@/constants/seats';
import {
  getDeckPlacement,
  getDiscardPilePlacement,
  getPlayerFrontPlacement,
  getPlayerHandPlacement,
} from '@/utils/zoneLayout';

export type CardTarget = {
  cardId: string;
  value: SerializedCard['value'];
  color: SerializedCard['color'];
  placement: CardPlacement;
  immediate?: boolean;
};

/** Flatten MagnetState into a single array of per-card animation targets. */
export const computeAllTargets = (
  magnet: MagnetState,
  seats: Seat[],
): CardTarget[] => {
  const targets: CardTarget[] = [];

  magnet.deck.forEach((card, i) => {
    targets.push({
      cardId: card.id,
      value: card.value,
      color: card.color,
      placement: getDeckPlacement(i),
    });
  });

  magnet.discardPile.forEach((card, i) => {
    targets.push({
      cardId: card.id,
      value: card.value,
      color: card.color,
      placement: getDiscardPilePlacement(i),
    });
  });

  magnet.playerFronts.forEach((cards, playerIndex) => {
    cards.forEach((card, i) => {
      targets.push({
        cardId: card.id,
        value: card.value,
        color: card.color,
        placement: getPlayerFrontPlacement(i, seats[playerIndex]),
      });
    });
  });

  const revealSnap = magnet.phase === 'revealing';

  magnet.playerHands.forEach((cards, playerIndex) => {
    cards.forEach((card, i) => {
      targets.push({
        cardId: card.id,
        value: card.value,
        color: card.color,
        placement: getPlayerHandPlacement(i, cards.length, seats[playerIndex], playerIndex === 0),
        immediate: revealSnap,
      });
    });
  });

  return targets;
};
