import { useRef, useState, useEffect, useCallback } from 'react';
import type { GameSnapshot, SerializedCard } from '@/types/game';
import {
  DEAL_INTERVAL,
  REVEAL_LIFT_DELAY,
  REVEAL_TURN_DELAY,
  SPREAD_CARD_DELAY,
  DISCARD_LIFT_DELAY,
  DISCARD_FLIP_DELAY,
  DISCARD_MOVE_DELAY,
  DISCARD_DROP_DELAY,
  PLAY_GAP_DELAY,
  PLAY_LIFT_DELAY,
  PLAY_MOVE_DELAY,
  PLAY_ROTATE_DELAY,
  PLAY_DROP_DELAY,
  DRAW_LIFT_DELAY,
  DRAW_MOVE_DELAY,
  DRAW_GAP_DELAY,
  DRAW_DROP_DELAY,
} from './useMagnetState.constants';
import { playSwoosh, playFan, playSlide, playPlop } from '@/utils/sounds';
import type { MagnetState, QueueStep } from './types';
import {
  applyStep,
  findSortedInsertIndex,
  snapshotToMagnetState,
} from './applyStep';

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
    playingPlayerIndex: -1,
    selectedCardId: null,
    liftingCardId: null,
    direction: 'clockwise',
    currentPlayerName: null,
    drawFloat: [],
    drawingPlayerIndex: -1,
    drawInsertIndex: -1,
  });

  const initializedRef = useRef(false);
  const queueRef = useRef<QueueStep[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allCardsRef = useRef<Map<string, SerializedCard>>(new Map());
  const latestSnapshotRef = useRef<GameSnapshot | null>(null);
  latestSnapshotRef.current = snapshot;
  const animatingRef = useRef(false);
  // Incremented when the animation queue empties, forcing the gameplay
  // effect to re-evaluate even when snapshot/phase refs haven't changed.
  const [syncTick, setSyncTick] = useState(0);

  // --- Queue processor ---

  const processNext = useCallback(() => {
    const step = queueRef.current[0];
    if (!step) {
      // Queue exhausted — clear the flag and bump the sync tick so the
      // gameplay effect re-runs to detect any snapshots that arrived
      // while the animation was in progress (e.g. visitor play during
      // AI play animation).
      animatingRef.current = false;
      setSyncTick((t) => t + 1);
      return;
    }

    queueRef.current.shift();
    setState((prev) => applyStep(prev, step, allCardsRef.current));

    // Phase steps are instant — apply and immediately continue so React
    // batches the phase change with the first real step (no intermediate render).
    if (step.type === 'phase') {
      if (step.phase === 'spreading') setTimeout(playFan, 100);
      // eslint-disable-next-line react-hooks/immutability -- synchronous recursion; processNext is assigned when this executes
      processNext();
      return;
    }

    if (step.type === 'deal' || step.type === 'draw_lift') playSwoosh();
    if (
      step.type === 'play_gap' ||
      step.type === 'play_move' ||
      step.type === 'draw_gap'
    )
      playSlide();
    if (step.type === 'play_drop' || step.type === 'discard_drop') {
      setTimeout(playPlop, 250);
    }

    const delay = (() => {
      switch (step.type) {
        case 'deal':
          return DEAL_INTERVAL;
        case 'reveal_pickup':
          return REVEAL_LIFT_DELAY;
        case 'reveal_turn':
          return REVEAL_TURN_DELAY;
        case 'spread_card':
          return SPREAD_CARD_DELAY;
        case 'discard_lift':
          return DISCARD_LIFT_DELAY;
        case 'discard_flip':
          return DISCARD_FLIP_DELAY;
        case 'discard_move':
          return DISCARD_MOVE_DELAY;
        case 'discard_drop':
          return DISCARD_DROP_DELAY;
        case 'play_gap':
          return PLAY_GAP_DELAY;
        case 'play_lift':
          return PLAY_LIFT_DELAY;
        case 'play_move':
          return PLAY_MOVE_DELAY;
        case 'play_rotate':
          return PLAY_ROTATE_DELAY;
        case 'play_drop':
          return PLAY_DROP_DELAY;
        case 'draw_lift':
          return DRAW_LIFT_DELAY;
        case 'draw_move':
          return DRAW_MOVE_DELAY;
        case 'draw_gap':
          return DRAW_GAP_DELAY;
        case 'draw_drop':
          return DRAW_DROP_DELAY;
      }
    })();

    if (queueRef.current.length > 0) {
      timerRef.current = setTimeout(() => processNext(), delay);
    } else {
      // Last step processed — clear flag so the gameplay effect handles syncing.
      animatingRef.current = false;
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
      playingPlayerIndex: -1,
      selectedCardId: null,
      liftingCardId: null,
      direction: snapshot.direction,
      currentPlayerName: snapshot.currentPlayerName,
      drawFloat: [],
      drawingPlayerIndex: -1,
      drawInsertIndex: -1,
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
    if (animatingRef.current) return;

    // Detect if a card was played: new discard pile is longer than current
    const newTopCard = snapshot.discardPile[snapshot.discardPile.length - 1];
    const prevDiscardLen = state.discardPile.length;
    const cardPlayed =
      newTopCard && snapshot.discardPile.length > prevDiscardLen;

    if (cardPlayed) {
      // Update card data so wild cards carry the chosen color from the snapshot
      allCardsRef.current.set(newTopCard.id, newTopCard);

      // Find which player lost a card
      const playerIndex = state.playerHands.findIndex((hand) =>
        hand.some((c) => c.id === newTopCard.id),
      );
      if (playerIndex >= 0) {
        animatingRef.current = true;
        const steps: QueueStep[] = [
          { type: 'phase', phase: 'play_gap' },
          { type: 'play_gap', cardId: newTopCard.id, playerIndex },
          { type: 'phase', phase: 'play_lift' },
          { type: 'play_lift', cardId: newTopCard.id, playerIndex },
          { type: 'phase', phase: 'play_move' },
          { type: 'play_move' },
          { type: 'phase', phase: 'play_rotate' },
          { type: 'play_rotate' },
          { type: 'play_drop' },
          {
            type: 'phase',
            phase: 'playing',
            currentPlayerName: snapshot.currentPlayerName,
            direction: snapshot.direction,
          },
        ];
        queueRef.current = steps;
        processNext();
        return;
      }
    }

    // Detect if cards were drawn: a player's hand grew
    for (let pi = 0; pi < snapshot.players.length; pi++) {
      const prevHandLen = state.playerHands[pi]?.length ?? 0;
      const newHandLen = snapshot.players[pi].hand.length;
      if (newHandLen > prevHandLen) {
        const prevIds = new Set(state.playerHands[pi].map((c) => c.id));
        const newCards = snapshot.players[pi].hand.filter(
          (c) => !prevIds.has(c.id),
        );

        if (newCards.length > 0) {
          animatingRef.current = true;
          // Register new cards in the lookup
          for (const card of newCards) allCardsRef.current.set(card.id, card);

          const steps: QueueStep[] = [];
          const currentSortedHand = [...state.playerHands[pi]];

          for (let ci = 0; ci < newCards.length; ci++) {
            const card = newCards[ci];
            // Compute insertion index into the progressively growing hand
            const handSoFar = [...currentSortedHand];
            for (let prev = 0; prev < ci; prev++) {
              const idx = findSortedInsertIndex(handSoFar, newCards[prev]);
              handSoFar.splice(idx, 0, newCards[prev]);
            }
            const insertIdx = findSortedInsertIndex(handSoFar, card);

            steps.push({ type: 'phase', phase: 'draw_lift' });
            steps.push({ type: 'draw_lift', cardId: card.id, playerIndex: pi });
            steps.push({ type: 'phase', phase: 'draw_move' });
            steps.push({ type: 'draw_move' });
            steps.push({ type: 'phase', phase: 'draw_gap' });
            steps.push({ type: 'draw_gap', insertIndex: insertIdx });
            steps.push({ type: 'phase', phase: 'draw_drop' });
            steps.push({ type: 'draw_drop' });
          }
          steps.push({
            type: 'phase',
            phase: 'playing',
            currentPlayerName: snapshot.currentPlayerName,
            direction: snapshot.direction,
          });
          queueRef.current = steps;
          processNext();
          return;
        }
      }
    }

    setState(snapshotToMagnetState(snapshot));
  }, [snapshot, state.phase, syncTick]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Reset: collect all cards back to deck when snapshot nulls ---

  useEffect(() => {
    if (snapshot !== null || !initializedRef.current) return;

    // Cancel any in-progress animation
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    queueRef.current = [];
    animatingRef.current = false;
    initializedRef.current = false;

    // Gather every card from all zones into the deck
    setState((prev) => {
      const allCards: SerializedCard[] = [
        ...prev.deck,
        ...prev.discardPile,
        ...prev.discardFloat,
        ...prev.drawFloat,
        ...prev.playerFronts.flat(),
        ...prev.playerStaging.flat(),
        ...prev.playerHands.flat(),
      ];
      return {
        deck: allCards,
        discardPile: [],
        discardFloat: [],
        playerFronts: prev.playerFronts.map(() => []),
        playerStaging: prev.playerStaging.map(() => []),
        playerHands: prev.playerHands.map(() => []),
        phase: 'idle',
        spreadProgress: 0,
        playingPlayerIndex: -1,
        selectedCardId: null,
        liftingCardId: null,
        direction: prev.direction,
        currentPlayerName: null,
        drawFloat: [],
        drawingPlayerIndex: -1,
        drawInsertIndex: -1,
      };
    });
  }, [snapshot]);

  // --- Cleanup ---

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return state;
};
