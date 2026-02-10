import { useState, useEffect, useCallback } from 'react';
import type { GameSnapshot, SerializedCard } from '@/types/game';
import type { MagnetState, QueueStep } from '@/hooks/useMagnetState';
import { applyStep } from '@/hooks/useMagnetState';

const PLAY_INTERVAL = 300;

const EMPTY_STATE: MagnetState = {
  deck: [],
  discardPile: [],
  discardFloat: [],
  playerFronts: [],
  playerStaging: [],
  playerHands: [],
  phase: 'idle',
  spreadProgress: 0,
  playingPlayerIndex: -1,
  selectedCardId: null,
  liftingCardId: null,
  direction: 'clockwise',
  currentPlayerName: null,
};

export type MagnetTimeline = {
  state: MagnetState;
  stepIndex: number;
  totalSteps: number;
  seek: (index: number) => void;
  playing: boolean;
  scrubbing: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
};

/**
 * Debug hook: pre-computes all animation states from the queue
 * so they can be scrubbed with a slider.
 */
export const useMagnetTimeline = (
  snapshot: GameSnapshot | null,
): MagnetTimeline => {
  const [timeline, setTimeline] = useState<MagnetState[]>([EMPTY_STATE]);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);

  // Build the full timeline on first snapshot
  useEffect(() => {
    if (!snapshot) return;

    const playerCount = snapshot.players.length;

    // Build card lookup
    const cardMap = new Map<string, SerializedCard>();
    for (const card of snapshot.drawPile) cardMap.set(card.id, card);
    for (const card of snapshot.discardPile) cardMap.set(card.id, card);
    for (const player of snapshot.players) {
      for (const card of player.hand) cardMap.set(card.id, card);
    }

    const allCards = Array.from(cardMap.values());

    const initial: MagnetState = {
      deck: allCards,
      discardPile: [],
      discardFloat: [],
      playerFronts: Array.from({ length: playerCount }, () => []),
      playerStaging: Array.from({ length: playerCount }, () => []),
      playerHands: Array.from({ length: playerCount }, () => []),
      phase: 'dealing',
      spreadProgress: 0,
      playingPlayerIndex: -1,
      selectedCardId: null,
      liftingCardId: null,
      direction: snapshot.direction,
      currentPlayerName: snapshot.currentPlayerName,
    };

    // Build queue (mirrors useMagnetState logic)
    const queue: QueueStep[] = [];
    const cardsPerPlayer = snapshot.players[0]?.hand.length ?? 7;
    for (let round = 0; round < cardsPerPlayer; round++) {
      for (let p = 0; p < playerCount; p++) {
        const card = snapshot.players[p].hand[round];
        if (card) queue.push({ type: 'deal', cardId: card.id, playerIndex: p });
      }
    }
    queue.push({ type: 'phase', phase: 'revealing' });
    queue.push({ type: 'reveal_pickup' });
    queue.push({ type: 'reveal_turn' });

    queue.push({ type: 'phase', phase: 'spreading' });
    for (let i = 0; i < cardsPerPlayer; i++) {
      queue.push({ type: 'spread_card' });
    }

    if (snapshot.discardPile.length > 0) {
      const discardCardId = snapshot.discardPile[0].id;
      queue.push({ type: 'phase', phase: 'discard_lift' });
      queue.push({ type: 'discard_lift', cardId: discardCardId });
      queue.push({ type: 'phase', phase: 'discard_move' });
      queue.push({ type: 'discard_move' });
      queue.push({ type: 'phase', phase: 'discard_flip' });
      queue.push({ type: 'discard_flip' });
      queue.push({ type: 'discard_drop' });
    }
    queue.push({ type: 'phase', phase: 'playing' });

    // Pre-compute all states by folding through queue steps.
    // Phase-only steps are merged into the previous state (no visible change).
    const states: MagnetState[] = [initial];
    let current = initial;
    for (const step of queue) {
      current = applyStep(current, step, cardMap);
      if (step.type === 'phase') {
        states[states.length - 1] = current;
      } else {
        states.push(current);
      }
    }

    setTimeline(states);
    setStepIndex(0);
    setPlaying(false);
  }, [snapshot]);

  // Auto-play: advance one step at a time
  useEffect(() => {
    if (!playing) return;
    if (stepIndex >= timeline.length - 1) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setStepIndex((i) => i + 1), PLAY_INTERVAL);
    return () => clearTimeout(id);
  }, [playing, stepIndex, timeline.length]);

  const seek = useCallback((index: number) => {
    setScrubbing(true);
    setStepIndex(index);
    requestAnimationFrame(() => setScrubbing(false));
  }, []);

  return {
    state: timeline[stepIndex] ?? EMPTY_STATE,
    stepIndex,
    totalSteps: timeline.length,
    seek,
    playing,
    scrubbing,
    play: useCallback(() => setPlaying(true), []),
    pause: useCallback(() => setPlaying(false), []),
    toggle: useCallback(() => setPlaying((p) => !p), []),
    reset: useCallback(() => {
      setStepIndex(0);
      setPlaying(false);
    }, []),
  };
};
