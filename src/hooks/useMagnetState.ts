import { useRef, useState, useEffect, useCallback } from 'react';
import type { GameSnapshot, SerializedCard } from '@/types/game';

// --- Timing constants (ms) ---
const DEAL_INTERVAL = 40;
const REVEAL_LIFT_DELAY = 200;
const REVEAL_TURN_DELAY = 200;
const SPREAD_CARD_DELAY = 15;
const DISCARD_LIFT_DELAY = 200;
const DISCARD_FLIP_DELAY = 250;
const DISCARD_MOVE_DELAY = 250;
const DISCARD_DROP_DELAY = 150;

// --- Types ---

export type MagnetState = {
  deck: SerializedCard[];
  discardPile: SerializedCard[];
  discardFloat: SerializedCard[];
  playerFronts: SerializedCard[][];
  playerStaging: SerializedCard[][];
  playerHands: SerializedCard[][];
  phase: MagnetPhase;
  /** Number of cards per player that have fanned out to their spread position */
  spreadProgress: number;
};

export type MagnetPhase =
  | 'idle'
  | 'dealing'
  | 'revealing'
  | 'spreading'
  | 'discard_lift'
  | 'discard_flip'
  | 'discard_move'
  | 'playing';

export type QueueStep =
  | { type: 'deal'; cardId: string; playerIndex: number }
  | { type: 'reveal_pickup' }
  | { type: 'reveal_turn' }
  | { type: 'spread_card' }
  | { type: 'discard_lift'; cardId: string }
  | { type: 'discard_flip' }
  | { type: 'discard_move' }
  | { type: 'discard_drop' }
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
export const useMagnetState = (
  snapshot: GameSnapshot | null,
  tableReady = false,
): MagnetState => {
  const playerCount = snapshot?.players.length ?? 0;

  const [state, setState] = useState<MagnetState>({
    deck: [],
    discardPile: [],
    discardFloat: [],
    playerFronts: [],
    playerStaging: [],
    playerHands: [],
    phase: 'idle',
    spreadProgress: 0,
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
    setState((prev) => applyStep(prev, step, allCardsRef.current));

    // Phase steps are instant — apply and immediately continue so React
    // batches the phase change with the first real step (no intermediate render).
    if (step.type === 'phase') {
      // eslint-disable-next-line react-hooks/immutability -- synchronous recursion; processNext is assigned when this executes
      processNext();
      return;
    }

    const delay = (() => {
      switch (step.type) {
        case 'deal': return DEAL_INTERVAL;
        case 'reveal_pickup': return REVEAL_LIFT_DELAY;
        case 'reveal_turn': return REVEAL_TURN_DELAY;
        case 'spread_card': return SPREAD_CARD_DELAY;
        case 'discard_lift': return DISCARD_LIFT_DELAY;
        case 'discard_flip': return DISCARD_FLIP_DELAY;
        case 'discard_move': return DISCARD_MOVE_DELAY;
        case 'discard_drop': return DISCARD_DROP_DELAY;
      }
    })();

    if (queueRef.current.length > 0) {
      timerRef.current = setTimeout(() => processNext(), delay);
    } else {
      // TODO: re-enable snapshot sync once full reveal sequence is in place
      // Queue empty — currently just stop (cards stay in staging)
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
      discardFloat: [],
      playerFronts: Array.from({ length: playerCount }, () => []),
      playerStaging: Array.from({ length: playerCount }, () => []),
      playerHands: Array.from({ length: playerCount }, () => []),
      phase: 'dealing',
      spreadProgress: 0,
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

    // 2. REVEAL: all players lift then flip simultaneously
    queue.push({ type: 'phase', phase: 'revealing' });
    queue.push({ type: 'reveal_pickup' });
    queue.push({ type: 'reveal_turn' });

    // 3. SPREAD: stagger cards into fan positions
    queue.push({ type: 'phase', phase: 'spreading' });
    for (let i = 0; i < cardsPerPlayer; i++) {
      queue.push({ type: 'spread_card' });
    }

    // 4. INITIAL DISCARD: lift → move → flip → drop
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

    queueRef.current = queue;
    // The kickoff effect below will start processing once phase='dealing' commits.
  }, [snapshot, playerCount]);

  // --- Queue kickoff: start processing when dealing begins ---
  // Decoupled from the init effect so StrictMode's cleanup/re-fire cycle
  // cannot permanently kill the timer (the last effect invocation wins).
  // Only triggers for 'dealing'; subsequent phases are reached via
  // processNext's synchronous recursion through phase steps.

  useEffect(() => {
    if (state.phase !== 'dealing') return;
    if (!tableReady) return;
    if (queueRef.current.length === 0) return;

    // Use a local timer — NOT timerRef — so cleanup only cancels this
    // kickoff timer without accidentally killing processNext's own timers.
    const id = setTimeout(() => processNext(), DEAL_INTERVAL);
    return () => clearTimeout(id);
  }, [state.phase, tableReady, processNext]);

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
export const applyStep = (
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

    case 'reveal_pickup': {
      const newFronts = prev.playerFronts.map(() => [] as SerializedCard[]);
      const newStaging = prev.playerStaging.map((s, i) => [...s, ...prev.playerFronts[i]]);
      return { ...prev, playerFronts: newFronts, playerStaging: newStaging };
    }

    case 'reveal_turn': {
      const newStaging = prev.playerStaging.map(() => [] as SerializedCard[]);
      const newHands = prev.playerHands.map((h, i) => [...h, ...prev.playerStaging[i]]);
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
  }
};

/** Sort cards: by color (red, blue, green, yellow), then value ascending, wilds last */
const sortCards = (a: SerializedCard, b: SerializedCard): number => {
  const aWild = a.color == null ? 1 : 0;
  const bWild = b.color == null ? 1 : 0;
  if (aWild !== bWild) return aWild - bWild;
  if (a.color !== b.color) return (a.color ?? 0) - (b.color ?? 0);
  return a.value - b.value;
};

/** Convert a snapshot directly to magnet state (for playing phase) */
const snapshotToMagnetState = (snapshot: GameSnapshot): MagnetState => ({
  deck: snapshot.drawPile,
  discardPile: snapshot.discardPile,
  discardFloat: [],
  playerFronts: snapshot.players.map(() => []),
  playerStaging: snapshot.players.map(() => []),
  playerHands: snapshot.players.map((p) => [...p.hand].sort(sortCards)),
  phase: 'playing',
  spreadProgress: Math.max(0, ...snapshot.players.map((p) => p.hand.length)),
});
