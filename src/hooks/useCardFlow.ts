import { useCallback, useRef, useState } from 'react';
import type { Color } from 'uno-engine';

type UseCardFlowOptions = {
  playCard: (cardId: string, color?: Color) => void;
  drawCard: () => {
    cardId: string;
    isPlayable: boolean;
    isWild: boolean;
  } | null;
  passAfterDraw: () => void;
  cancelVisitorTimer: () => void;
};

export const useCardFlow = ({
  playCard,
  drawCard,
  passAfterDraw,
  cancelVisitorTimer,
}: UseCardFlowOptions) => {
  // --- Wild card state ---
  const [pendingWildCardId, setPendingWildCardId] = useState<string | null>(
    null,
  );
  const [drawnWildCardId, setDrawnWildCardId] = useState<string | null>(null);

  const handleWildCardPlayed = useCallback(
    (cardId: string) => {
      cancelVisitorTimer();
      setPendingWildCardId(cardId);
    },
    [cancelVisitorTimer],
  );

  const handleWildDismiss = useCallback(() => {
    setPendingWildCardId(null);
    setDrawnWildCardId(null);
  }, []);

  const handleWildColorSelect = useCallback(
    (color: Color) => {
      if (pendingWildCardId) playCard(pendingWildCardId, color);
      setPendingWildCardId(null);
      setDrawnWildCardId(null);
    },
    [pendingWildCardId, playCard],
  );

  // --- Draw-choice state ---
  const pendingDrawRef = useRef<{
    cardId: string;
    isPlayable: boolean;
    isWild: boolean;
  } | null>(null);
  const [drawPending, setDrawPending] = useState(false);
  const [drawChoice, setDrawChoice] = useState<{
    cardId: string;
    isWild: boolean;
  } | null>(null);

  const handleDrawCard = useCallback(() => {
    const result = drawCard();
    pendingDrawRef.current = result;
    if (result) setDrawPending(true);
  }, [drawCard]);

  const handleAnimationIdle = useCallback(() => {
    const pending = pendingDrawRef.current;
    if (!pending) return;
    pendingDrawRef.current = null;
    setDrawPending(false);
    if (pending.isPlayable) {
      setDrawChoice({ cardId: pending.cardId, isWild: pending.isWild });
    } else {
      passAfterDraw();
    }
  }, [passAfterDraw]);

  const handleDrawPlay = useCallback(() => {
    cancelVisitorTimer();
    if (!drawChoice) return;
    if (drawChoice.isWild) {
      setPendingWildCardId(drawChoice.cardId);
      setDrawnWildCardId(drawChoice.cardId);
    } else {
      playCard(drawChoice.cardId);
    }
    setDrawChoice(null);
  }, [drawChoice, playCard, cancelVisitorTimer]);

  const handleDrawCardClicked = useCallback(
    (_cardId: string) => handleDrawPlay(),
    [handleDrawPlay],
  );

  const handleDrawSkip = useCallback(() => {
    setDrawChoice(null);
    passAfterDraw();
  }, [passAfterDraw]);

  // --- Reset (called on play again / restart) ---
  const reset = useCallback(() => {
    setPendingWildCardId(null);
    setDrawnWildCardId(null);
    setDrawChoice(null);
    setDrawPending(false);
    pendingDrawRef.current = null;
  }, []);

  return {
    pendingWildCardId,
    drawnWildCardId,
    drawPending,
    drawChoice,
    handleDrawCard,
    handleAnimationIdle,
    handleDrawPlay,
    handleDrawCardClicked,
    handleDrawSkip,
    handleWildCardPlayed,
    handleWildDismiss,
    handleWildColorSelect,
    reset,
  };
};
