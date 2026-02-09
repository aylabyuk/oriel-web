import type { MagnetState } from '@/hooks/useMagnetState';
import type { CardPlacement } from '@/utils/zoneLayout';
import type { SerializedCard } from '@/types/game';
import type { Seat } from '@/constants/seats';
import {
  getDeckPlacement,
  getDiscardPilePlacement,
  getPlayerFrontPlacement,
  getPlayerStagingPlacement,
  getPlayerTurnedPlacement,
  getPlayerHandPlacement,
} from '@/utils/zoneLayout';

export type SpringConfig = {
  tension?: number;
  friction?: number;
  duration?: number;
};

export type CardTarget = {
  cardId: string;
  value: SerializedCard['value'];
  color: SerializedCard['color'];
  placement: CardPlacement;
  immediate?: boolean;
  springConfig?: SpringConfig;
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

  magnet.playerStaging.forEach((cards, playerIndex) => {
    cards.forEach((card, i) => {
      targets.push({
        cardId: card.id,
        value: card.value,
        color: card.color,
        placement: getPlayerStagingPlacement(i, seats[playerIndex]),
      });
    });
  });

  magnet.playerHands.forEach((cards, playerIndex) => {
    cards.forEach((card, i) => {
      const isPlaying = magnet.phase === 'playing';
      const placement = isPlaying
        ? getPlayerHandPlacement(i, cards.length, seats[playerIndex], playerIndex === 0)
        : getPlayerTurnedPlacement(i, cards.length, seats[playerIndex]);
      targets.push({
        cardId: card.id,
        value: card.value,
        color: card.color,
        placement,
      });
    });
  });

  return targets;
};
