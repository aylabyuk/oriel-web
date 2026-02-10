import type { MagnetState } from '@/hooks/useMagnetState';
import type { CardPlacement } from '@/utils/zoneLayout';
import type { SerializedCard } from '@/types/game';
import type { Seat } from '@/constants/seats';
import {
  getDeckPlacement,
  getDiscardPilePlacement,
  getDiscardLiftPlacement,
  getDiscardMovePlacement,
  getDiscardFloatPlacement,
  getPlayLiftPlacement,
  getPlayMovePlacement,
  getPlayRotatePlacement,
  getDrawLiftPlacement,
  getDrawMovePlacement,
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
  playable?: boolean;
  deckClickable?: boolean;
};

/** Flatten MagnetState into a single array of per-card animation targets. */
export const computeAllTargets = (
  magnet: MagnetState,
  seats: Seat[],
  playableCardIds?: string[],
  deckRenderLimit = magnet.deck.length,
  deckClickable = false,
): CardTarget[] => {
  const playableSet = playableCardIds ? new Set(playableCardIds) : undefined;
  const targets: CardTarget[] = [];

  const deckStart = Math.max(0, magnet.deck.length - deckRenderLimit);
  const topDeckIndex = magnet.deck.length - 1;
  magnet.deck.forEach((card, i) => {
    if (i < deckStart) return;
    targets.push({
      cardId: card.id,
      value: card.value,
      color: card.color,
      placement: getDeckPlacement(i),
      deckClickable: deckClickable && i === topDeckIndex,
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

  magnet.discardFloat.forEach((card) => {
    const placement = (() => {
      switch (magnet.phase) {
        case 'discard_lift': return getDiscardLiftPlacement();
        case 'discard_move': return getDiscardMovePlacement();
        case 'discard_flip': return { ...getDiscardMovePlacement(), tilt: -Math.PI / 2, faceUp: true };
        case 'play_lift': return getPlayLiftPlacement(seats[magnet.playingPlayerIndex], magnet.playingPlayerIndex === 0);
        case 'play_move': return getPlayMovePlacement(seats[magnet.playingPlayerIndex], magnet.playingPlayerIndex === 0);
        case 'play_rotate': return getPlayRotatePlacement();
        default: return getDiscardFloatPlacement();
      }
    })();
    targets.push({
      cardId: card.id,
      value: card.value,
      color: card.color,
      placement,
    });
  });

  magnet.drawFloat.forEach((card) => {
    const seat = seats[magnet.drawingPlayerIndex];
    const isHuman = magnet.drawingPlayerIndex === 0;
    const handSize = magnet.playerHands[magnet.drawingPlayerIndex]?.length ?? 0;
    const insertIdx = magnet.drawInsertIndex >= 0 ? magnet.drawInsertIndex : undefined;
    const placement = (() => {
      switch (magnet.phase) {
        case 'draw_lift': return getDrawLiftPlacement();
        case 'draw_move':
          return getDrawMovePlacement(seat, isHuman);
        case 'draw_gap':
          return getDrawMovePlacement(seat, isHuman, insertIdx, handSize);
        default: return getDrawMovePlacement(seat, isHuman, insertIdx, handSize);
      }
    })();
    targets.push({
      cardId: card.id,
      value: card.value,
      color: card.color,
      placement,
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
    const gapIdx = magnet.selectedCardId
      ? cards.findIndex((c) => c.id === magnet.selectedCardId)
      : -1;

    // During draw_drop the card is already in the hand — use gapAtIndex
    // (which skips the card itself) so neighbors stay spread while it settles.
    const isDrawDrop = magnet.phase === 'draw_drop'
      && playerIndex === magnet.drawingPlayerIndex
      && magnet.drawInsertIndex >= 0;
    const gapAtIndex = gapIdx >= 0
      ? gapIdx
      : isDrawDrop ? magnet.drawInsertIndex : undefined;

    // Draw gap: neighbors spread to make room at insertion point
    // (only during draw_gap — draw_drop uses gapAtIndex above instead)
    const insertGap = (
      magnet.phase === 'draw_gap' &&
      playerIndex === magnet.drawingPlayerIndex &&
      magnet.drawInsertIndex >= 0
    ) ? magnet.drawInsertIndex : undefined;

    cards.forEach((card, i) => {
      // Card lifting out of hand — render with lift placement
      if (card.id === magnet.liftingCardId) {
        targets.push({
          cardId: card.id,
          value: card.value,
          color: card.color,
          placement: getPlayLiftPlacement(seats[playerIndex], playerIndex === 0, i, cards.length),
        });
        return;
      }

      const isSpread = i < magnet.spreadProgress;
      const placement = isSpread
        ? getPlayerHandPlacement(i, cards.length, seats[playerIndex], playerIndex === 0, gapAtIndex, insertGap)
        : getPlayerTurnedPlacement(i, cards.length, seats[playerIndex]);
      targets.push({
        cardId: card.id,
        value: card.value,
        color: card.color,
        placement,
        playable: playerIndex === 0 && playableSet?.has(card.id),
      });
    });
  });
  return targets;
};
