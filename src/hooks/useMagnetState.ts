import { useRef, useState, useEffect, useCallback } from 'react';
import type { GameSnapshot, SerializedCard } from '@/types/game';

// --- Timing constants (ms) ---
const DEAL_INTERVAL = 200;
const REVEAL_INTERVAL = 400;
const INITIAL_DISCARD_DELAY = 300;

// --- Types ---

export type MagnetState = {
  deck: SerializedCard[];
  discardPile: SerializedCard[];
  playerFronts: SerializedCard[][];
  playerHands: SerializedCard[][];
  phase: MagnetPhase;
};

export type MagnetPhase =
  | 'idle'
  | 'dealing'
  | 'revealing'
  | 'initial_discard'
  | 'playing';

type QueueStep =
  | { type: 'deal'; cardId: string; playerIndex: number }
  | { type: 'reveal'; playerIndex: number }
  | { type: 'initial_discard'; cardId: string }
  | { type: 'phase'; phase: MagnetPhase };

/**
 * Manages card zone assignments over time for the Magnet Card system.
 *
 * Takes the game engine snapshot and returns time-sequenced zone assignments.
 * On first snapshot: queues dealing -> reveal -> initial discard sequence.
 * During gameplay: mirrors snapshot directly (float/preview phases added later).
 *
 * All steps auto-play on timers including phase transitions.
 */
export const useMagnetState = (snapshot: GameSnapshot | null): MagnetState => {
  const playerCount = snapshot?.players.length ?? 0;

  const [state, setState] = useState<MagnetState>({
    deck: [],
    discardPile: [],
    playerFronts: [],
    playerHands: [],
    phase: 'idle',
  });

  const initializedRef = useRef(false);
  const queueRef = useRef<QueueStep[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allCardsRef = useRef<Map<string, SerializedCard>>(new Map());
  const latestSnapshotRef = useRef<GameSnapshot | null>(null);
  latestSnapshotRef.current = snapshot;

  // --- Queue processor ---

  const processNext = useCallback(() => {
    const step = queueRef.current[0];
    if (!step) return;

    queueRef.current.shift();

    const delay = (() => {
      switch (step.type) {
        case 'phase': return 0;
        case 'deal': return DEAL_INTERVAL;
        case 'reveal': return REVEAL_INTERVAL;
        case 'initial_discard': return INITIAL_DISCARD_DELAY;
      }
    })();

    setState((prev) => applyStep(prev, step, allCardsRef.current));

    if (queueRef.current.length > 0) {
      // eslint-disable-next-line react-hooks/immutability -- recursive setTimeout; variable is defined when the callback fires
      timerRef.current = setTimeout(() => processNext(), delay);
    } else {
      // Queue empty — sync with latest snapshot
      timerRef.current = setTimeout(() => {
        const snap = latestSnapshotRef.current;
        if (snap) {
          setState(snapshotToMagnetState(snap));
        }
      }, delay);
    }
  }, []);

  // --- Initialize on first snapshot ---

  useEffect(() => {
    if (!snapshot || initializedRef.current) return;
    initializedRef.current = true;

    // Build card lookup
    const cardMap = new Map<string, SerializedCard>();
    for (const card of snapshot.drawPile) cardMap.set(card.id, card);
    for (const card of snapshot.discardPile) cardMap.set(card.id, card);
    for (const player of snapshot.players) {
      for (const card of player.hand) cardMap.set(card.id, card);
    }
    allCardsRef.current = cardMap;

    // All cards start in the deck
    const allCards = Array.from(cardMap.values());

    setState({
      deck: allCards,
      discardPile: [],
      playerFronts: Array.from({ length: playerCount }, () => []),
      playerHands: Array.from({ length: playerCount }, () => []),
      phase: 'dealing',
    });

    // Build the queue
    const queue: QueueStep[] = [];

    // 1. DEALING: round-robin cards from deck to player fronts
    const cardsPerPlayer = snapshot.players[0]?.hand.length ?? 7;
    for (let round = 0; round < cardsPerPlayer; round++) {
      for (let p = 0; p < playerCount; p++) {
        const card = snapshot.players[p].hand[round];
        if (card) {
          queue.push({ type: 'deal', cardId: card.id, playerIndex: p });
        }
      }
    }

    // 2. REVEAL: move each player's front to hand
    queue.push({ type: 'phase', phase: 'revealing' });
    for (let p = 0; p < playerCount; p++) {
      queue.push({ type: 'reveal', playerIndex: p });
    }

    // 3. INITIAL_DISCARD: flip first discard card
    queue.push({ type: 'phase', phase: 'initial_discard' });
    if (snapshot.discardPile.length > 0) {
      queue.push({
        type: 'initial_discard',
        cardId: snapshot.discardPile[0].id,
      });
    }

    queue.push({ type: 'phase', phase: 'playing' });

    queueRef.current = queue;
    // The kickoff effect below will start processing once phase='dealing' commits.
  }, [snapshot, playerCount]);

  // --- Queue kickoff: start processing when entering a new active phase ---
  // Decoupled from the init effect so StrictMode's cleanup/re-fire cycle
  // cannot permanently kill the timer (the last effect invocation wins).

  useEffect(() => {
    if (state.phase === 'idle' || state.phase === 'playing') return;
    if (queueRef.current.length === 0) return;

    timerRef.current = setTimeout(() => processNext(), DEAL_INTERVAL);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.phase, processNext]);

  // --- During gameplay: sync with snapshot when in playing phase ---

  useEffect(() => {
    if (!snapshot || state.phase !== 'playing') return;
    setState(snapshotToMagnetState(snapshot));
  }, [snapshot, state.phase]);

  // --- Cleanup ---

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return state;
};

// --- Pure helpers ---

/** Apply a single queue step to the magnet state */
const applyStep = (
  prev: MagnetState,
  step: QueueStep,
  cardMap: Map<string, SerializedCard>,
): MagnetState => {
  switch (step.type) {
    case 'phase':
      return { ...prev, phase: step.phase };

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

    case 'reveal': {
      const newFronts = prev.playerFronts.map((f) => [...f]);
      const newHands = prev.playerHands.map((h) => [...h]);
      const cards = newFronts[step.playerIndex];
      newFronts[step.playerIndex] = [];
      newHands[step.playerIndex] = [...newHands[step.playerIndex], ...cards];
      return { ...prev, playerFronts: newFronts, playerHands: newHands };
    }

    case 'initial_discard': {
      const card = cardMap.get(step.cardId);
      if (!card) return prev;
      return {
        ...prev,
        deck: prev.deck.filter((c) => c.id !== step.cardId),
        discardPile: [...prev.discardPile, card],
      };
    }
  }
};

/** Convert a snapshot directly to magnet state (for playing phase) */
const snapshotToMagnetState = (snapshot: GameSnapshot): MagnetState => ({
  deck: snapshot.drawPile,
  discardPile: snapshot.discardPile,
  playerFronts: snapshot.players.map(() => []),
  playerHands: snapshot.players.map((p) => p.hand),
  phase: 'playing',
});
