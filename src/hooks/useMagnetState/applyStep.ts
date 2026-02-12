import type { GameSnapshot, SerializedCard } from '@/types/game';
import type { MagnetState, QueueStep } from './types';

/** Apply a single queue step to the magnet state */
export const applyStep = (
  prev: MagnetState,
  step: QueueStep,
  cardMap: Map<string, SerializedCard>,
): MagnetState => {
  switch (step.type) {
    case 'phase':
      return {
        ...prev,
        phase: step.phase,
        // Clear animation fields when returning to playing so gaps close
        ...(step.phase === 'playing'
          ? {
              playingPlayerIndex: -1,
              selectedCardId: null,
              liftingCardId: null,
              drawingPlayerIndex: -1,
              drawInsertIndex: -1,
            }
          : {}),
        // Apply deferred metadata when provided (syncs currentPlayer/direction
        // at the end of each animation so isVisitorTurn is correct immediately)
        ...(step.currentPlayerName !== undefined
          ? { currentPlayerName: step.currentPlayerName }
          : {}),
        ...(step.direction !== undefined ? { direction: step.direction } : {}),
      };

    case 'deal': {
      const card = cardMap.get(step.cardId);
      if (!card) return prev;
      const newFronts = prev.playerFronts.map((f) => [...f]);
      newFronts[step.playerIndex] = [...newFronts[step.playerIndex], card];
      return {
        ...prev,
        deck: prev.deck.filter((c) => c.id !== step.cardId),
        playerFronts: newFronts,
      };
    }

    case 'reveal_pickup': {
      const newFronts = prev.playerFronts.map(() => [] as SerializedCard[]);
      const newStaging = prev.playerStaging.map((s, i) => [
        ...s,
        ...prev.playerFronts[i],
      ]);
      return { ...prev, playerFronts: newFronts, playerStaging: newStaging };
    }

    case 'reveal_turn': {
      const newStaging = prev.playerStaging.map(() => [] as SerializedCard[]);
      const newHands = prev.playerHands.map((h, i) =>
        [...h, ...prev.playerStaging[i]].sort(sortCards),
      );
      return { ...prev, playerStaging: newStaging, playerHands: newHands };
    }

    case 'spread_card':
      return { ...prev, spreadProgress: prev.spreadProgress + 1 };

    case 'discard_lift': {
      const card = cardMap.get(step.cardId);
      if (!card) return prev;
      return {
        ...prev,
        deck: prev.deck.filter((c) => c.id !== step.cardId),
        discardFloat: [card],
      };
    }

    case 'discard_flip':
    case 'discard_move':
      // No zone change — phase change (via preceding phase step) drives
      // placement in computeAllTargets; return new ref to trigger re-render.
      return { ...prev };

    case 'discard_drop':
      return {
        ...prev,
        discardPile: [...prev.discardPile, ...prev.discardFloat],
        discardFloat: [],
      };

    case 'play_gap':
      return {
        ...prev,
        selectedCardId: step.cardId,
        playingPlayerIndex: step.playerIndex,
      };

    case 'play_lift':
      return {
        ...prev,
        liftingCardId: step.cardId,
      };

    case 'play_move': {
      const liftId = prev.liftingCardId;
      if (!liftId) return prev;
      const card = cardMap.get(liftId);
      if (!card) return prev;
      const newHands = prev.playerHands.map((h, i) =>
        i === prev.playingPlayerIndex ? h.filter((c) => c.id !== liftId) : h,
      );
      return {
        ...prev,
        playerHands: newHands,
        discardFloat: [card],
        selectedCardId: null,
        liftingCardId: null,
        spreadProgress: Math.max(0, ...newHands.map((h) => h.length)),
      };
    }

    case 'play_rotate':
      return { ...prev };

    case 'play_drop':
      return {
        ...prev,
        discardPile: [...prev.discardPile, ...prev.discardFloat],
        discardFloat: [],
        playingPlayerIndex: -1,
      };

    case 'draw_lift': {
      const drawnCard = cardMap.get(step.cardId);
      if (!drawnCard) return prev;
      // Pop the visual top of the deck (face-down, identity doesn't matter)
      // and place the actual drawn card into drawFloat.
      return {
        ...prev,
        deck: prev.deck.slice(0, -1),
        drawFloat: [drawnCard],
        drawingPlayerIndex: step.playerIndex,
      };
    }

    case 'draw_move':
      return { ...prev };

    case 'draw_gap':
      return { ...prev, drawInsertIndex: step.insertIndex };

    case 'draw_drop': {
      const card = prev.drawFloat[0];
      if (!card) return prev;
      const newHands = prev.playerHands.map((h, i) => {
        if (i !== prev.drawingPlayerIndex) return h;
        const hand = [...h];
        hand.splice(prev.drawInsertIndex, 0, card);
        return hand;
      });
      return {
        ...prev,
        playerHands: newHands,
        drawFloat: [],
        // Keep drawingPlayerIndex and drawInsertIndex so the gap stays
        // open while the card settles into its slot. Cleared on 'playing'.
        spreadProgress: Math.max(
          prev.spreadProgress,
          ...newHands.map((h) => h.length),
        ),
      };
    }
  }
};

/** Sort cards: by color (red, blue, green, yellow), then value ascending, wilds last */
export const sortCards = (a: SerializedCard, b: SerializedCard): number => {
  const aWild = a.color == null ? 1 : 0;
  const bWild = b.color == null ? 1 : 0;
  if (aWild !== bWild) return aWild - bWild;
  if (a.color !== b.color) return (a.color ?? 0) - (b.color ?? 0);
  return a.value - b.value;
};

/** Find the index where `card` should be inserted to maintain sorted order. */
export const findSortedInsertIndex = (
  sortedHand: SerializedCard[],
  card: SerializedCard,
): number => {
  for (let i = 0; i < sortedHand.length; i++) {
    if (sortCards(card, sortedHand[i]) <= 0) return i;
  }
  return sortedHand.length;
};

/** Convert a snapshot directly to magnet state (for playing phase) */
export const snapshotToMagnetState = (snapshot: GameSnapshot): MagnetState => ({
  deck: snapshot.drawPile,
  discardPile: snapshot.discardPile,
  discardFloat: [],
  playerFronts: snapshot.players.map(() => []),
  playerStaging: snapshot.players.map(() => []),
  playerHands: snapshot.players.map((p) => [...p.hand].sort(sortCards)),
  phase: 'playing',
  spreadProgress: Math.max(0, ...snapshot.players.map((p) => p.hand.length)),
  playingPlayerIndex: -1,
  selectedCardId: null,
  liftingCardId: null,
  direction: snapshot.direction,
  currentPlayerName: snapshot.currentPlayerName,
  drawFloat: [],
  drawingPlayerIndex: -1,
  drawInsertIndex: -1,
});
