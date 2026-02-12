import { useRef, useCallback, useEffect } from 'react';
import type { Color } from 'uno-engine';
import type { ChallengeResult, GameEndInfo } from '@/types/game';
import { UnoGame, getCardId } from '@/engine';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSnapshot, pushEvent, clearEvents } from '@/store/slices/game';
import { selectVisitorName } from '@/store/slices/visitor';
import { AI_NAMES, AI_NAME_SET, sanitizeVisitorName } from '@/constants/players';
import { playBluffCaught, playLegitPlay, playUnoPenalty } from '@/utils/sounds';
import {
  AI_ANIMATION_WAIT,
  AI_THINK_MIN,
  AI_THINK_MAX,
  AI_CATCH_MIN,
  AI_CATCH_MAX,
  AI_CATCH_CHANCE,
  AI_UNO_THINK_MIN,
  AI_UNO_THINK_MAX,
  AI_UNO_SELF_CALL_CHANCE,
  CATCH_WINDOW_DURATION,
  VISITOR_TURN_TIMEOUT,
  ALL_COLORS,
} from './useGameController.constants';

export const useGameController = () => {
  const dispatch = useAppDispatch();
  const visitorName = useAppSelector(selectVisitorName);
  const gameRef = useRef<UnoGame | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiScheduledRef = useRef(false);
  const unoCatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unoAiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visitorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleAiPlay = useCallback(() => {
    const game = gameRef.current;
    if (!game || aiScheduledRef.current) {
      return;
    }

    const currentPlayer = game.getCurrentPlayerName();
    if (!AI_NAME_SET.has(currentPlayer)) {
      return;
    }

    aiScheduledRef.current = true;
    const thinkDelay =
      AI_THINK_MIN + Math.random() * (AI_THINK_MAX - AI_THINK_MIN);
    const totalDelay = AI_ANIMATION_WAIT + thinkDelay;

    aiTimerRef.current = setTimeout(() => {
      aiScheduledRef.current = false;
      const g = gameRef.current;
      if (!g || g.getSnapshot().phase === 'ended') return;

      const playerName = g.getCurrentPlayerName();
      if (!AI_NAME_SET.has(playerName)) {
        return;
      }

      const playable = g.getPlayableCardsForPlayer(playerName);

      if (playable.length > 0) {
        const card = playable[Math.floor(Math.random() * playable.length)];
        const chosenColor = card.isWildCard()
          ? ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)]
          : undefined;
        try {
          g.playCard(card, chosenColor);
        } catch {
          g.draw();
          g.pass();
        }
      } else {
        g.draw();
        g.pass();
      }
    }, totalDelay);
  }, []);

  const cancelVisitorTimer = useCallback(() => {
    if (visitorTimerRef.current) {
      clearTimeout(visitorTimerRef.current);
      visitorTimerRef.current = null;
    }
  }, []);

  const scheduleVisitorAutoPlay = useCallback(() => {
    cancelVisitorTimer();
    const game = gameRef.current;
    if (!game) return;

    const humanName = visitorName || 'Player';
    if (game.getCurrentPlayerName() !== humanName) return;

    visitorTimerRef.current = setTimeout(() => {
      visitorTimerRef.current = null;
      const g = gameRef.current;
      if (!g || g.getSnapshot().phase === 'ended') return;
      if (g.getCurrentPlayerName() !== humanName) return;

      const playable = g.getPlayableCardsForPlayer(humanName);

      if (playable.length > 0) {
        const card = playable[Math.floor(Math.random() * playable.length)];
        const chosenColor = card.isWildCard()
          ? ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)]
          : undefined;
        try {
          g.playCard(card, chosenColor);
        } catch {
          g.draw();
          g.pass();
        }
      } else {
        g.draw();
        // Check if drawn card is playable
        const nowPlayable = g.getPlayableCards();
        if (nowPlayable.length > 0) {
          const card = nowPlayable[0];
          const chosenColor = card.isWildCard()
            ? ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)]
            : undefined;
          try {
            g.playCard(card, chosenColor);
          } catch {
            g.pass();
          }
        } else {
          g.pass();
        }
      }
    }, AI_ANIMATION_WAIT + VISITOR_TURN_TIMEOUT);
  }, [visitorName, cancelVisitorTimer]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      if (unoCatchTimerRef.current) clearTimeout(unoCatchTimerRef.current);
      if (unoAiTimerRef.current) clearTimeout(unoAiTimerRef.current);
      if (visitorTimerRef.current) clearTimeout(visitorTimerRef.current);
    };
  }, []);

  const startGame = useCallback(() => {
    if (gameRef.current) return;

    const playerNames = [sanitizeVisitorName(visitorName || 'Player'), ...AI_NAMES];
    const game = new UnoGame(playerNames, playerNames[0]);

    game.onEvent((event) => {
      dispatch(pushEvent(event));
      const snap = game.getSnapshot();
      dispatch(setSnapshot(snap));

      if (event.type === 'uno_penalty') playUnoPenalty();

      // Don't schedule AI play while a WD4 challenge is pending
      if (snap.pendingChallenge) return;

      // UNO detection — someone played to 1 card
      if (event.type === 'card_played' && snap.unoCallable) {
        const callable = snap.unoCallable.playerName;
        const humanName = playerNames[0];

        if (callable === humanName) {
          // Visitor played to 1 card — schedule AI catch attempt
          const catchDelay =
            AI_CATCH_MIN + Math.random() * (AI_CATCH_MAX - AI_CATCH_MIN);
          unoCatchTimerRef.current = setTimeout(() => {
            const g = gameRef.current;
            if (!g || g.getUnoCallable() !== humanName) return;
            if (Math.random() < AI_CATCH_CHANCE) {
              const catcher =
                AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)];
              g.callUno(catcher);
            }
            // Always close the UNO window when the catch timer expires
            g.setUnoCallable(null);
            dispatch(setSnapshot(g.getSnapshot()));
          }, catchDelay);
        } else if (AI_NAME_SET.has(callable)) {
          // AI played to 1 card — clear immediately so App doesn't show
          // the catch button yet, then schedule AI "think" timer
          game.setUnoCallable(null);
          dispatch(setSnapshot(game.getSnapshot()));

          const thinkDelay =
            AI_UNO_THINK_MIN +
            Math.random() * (AI_UNO_THINK_MAX - AI_UNO_THINK_MIN);
          unoAiTimerRef.current = setTimeout(() => {
            const g = gameRef.current;
            if (!g) return;
            if (Math.random() < AI_UNO_SELF_CALL_CHANCE) {
              // AI remembers — call UNO on itself, safe
              g.callUno(callable);
              dispatch(setSnapshot(g.getSnapshot()));
            } else {
              // AI forgot! Open catch window for visitor
              g.setUnoCallable(callable);
              dispatch(setSnapshot(g.getSnapshot()));
              // Auto-close the catch window after a duration
              unoAiTimerRef.current = setTimeout(() => {
                const g2 = gameRef.current;
                if (!g2 || g2.getUnoCallable() !== callable) return;
                g2.setUnoCallable(null);
                dispatch(setSnapshot(g2.getSnapshot()));
              }, CATCH_WINDOW_DURATION);
            }
          }, thinkDelay);
        }
      }

      // After any event, schedule the next player's move (skip if game ended)
      if (
        (event.type === 'turn_changed' || event.type === 'card_played') &&
        snap.phase !== 'ended'
      ) {
        scheduleAiPlay();
        scheduleVisitorAutoPlay();
      }
    });

    gameRef.current = game;
    dispatch(setSnapshot(game.getSnapshot()));

    // If the first player is AI, kick off their play; otherwise start visitor timer
    scheduleAiPlay();
    scheduleVisitorAutoPlay();
  }, [visitorName, dispatch, scheduleAiPlay, scheduleVisitorAutoPlay]);

  const playCard = useCallback(
    (cardId: string, chosenColor?: Color) => {
      cancelVisitorTimer();
      const game = gameRef.current;
      if (!game) return;
      const playerName = visitorName || 'Player';
      const card = game.findCardInHand(playerName, cardId);
      if (!card) return;
      try {
        game.playCard(card, chosenColor);
      } catch {
        // Invalid play — engine rejected it, ignore
      }
    },
    [visitorName, cancelVisitorTimer],
  );

  const drawCard = useCallback((): {
    cardId: string;
    isPlayable: boolean;
    isWild: boolean;
  } | null => {
    cancelVisitorTimer();
    const game = gameRef.current;
    if (!game) return null;
    const playerName = visitorName || 'Player';
    if (game.getCurrentPlayerName() !== playerName) return null;

    const handBefore = new Set(
      game.getPlayerHand(playerName).map((c) => getCardId(c)),
    );
    game.draw();

    const drawnCard = game
      .getPlayerHand(playerName)
      .find((c) => !handBefore.has(getCardId(c)));
    if (!drawnCard) return null;

    const cardId = getCardId(drawnCard);
    const isWild = drawnCard.isWildCard();
    const isPlayable = game
      .getPlayableCards()
      .some((c) => getCardId(c) === cardId);
    return { cardId, isPlayable, isWild };
  }, [visitorName, cancelVisitorTimer]);

  const passAfterDraw = useCallback(() => {
    cancelVisitorTimer();
    const game = gameRef.current;
    if (!game) return;
    game.pass();
  }, [cancelVisitorTimer]);

  /** Resolve a pending WD4 challenge. accept=true means no challenge. */
  const resolveChallenge = useCallback(
    (accept: boolean): ChallengeResult | null => {
      const game = gameRef.current;
      if (!game) return null;
      const result = game.resolveChallenge(accept);
      if (result === 'bluff_caught') playBluffCaught();
      else if (result === 'legit_play') playLegitPlay();
      dispatch(setSnapshot(game.getSnapshot()));
      // Resume scheduling after resolution
      scheduleAiPlay();
      scheduleVisitorAutoPlay();
      return result;
    },
    [dispatch, scheduleAiPlay, scheduleVisitorAutoPlay],
  );

  /** For AI victims: auto-decide challenge after a think delay. */
  const tryAutoResolveChallenge = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    const challenge = game.getPendingChallenge();
    if (!challenge || !AI_NAME_SET.has(challenge.victimName)) return;

    const thinkDelay =
      AI_THINK_MIN + Math.random() * (AI_THINK_MAX - AI_THINK_MIN);
    aiTimerRef.current = setTimeout(() => {
      const g = gameRef.current;
      if (!g) return;
      // AI challenges 60% of the time
      const shouldChallenge = Math.random() < 0.6;
      const result = g.resolveChallenge(!shouldChallenge);
      if (result === 'bluff_caught') playBluffCaught();
      else if (result === 'legit_play') playLegitPlay();
      dispatch(setSnapshot(g.getSnapshot()));
      scheduleAiPlay();
    }, thinkDelay);
  }, [dispatch, scheduleAiPlay]);

  const callUno = useCallback(
    (playerName: string) => {
      const game = gameRef.current;
      if (!game) return;
      if (unoCatchTimerRef.current) {
        clearTimeout(unoCatchTimerRef.current);
        unoCatchTimerRef.current = null;
      }
      if (unoAiTimerRef.current) {
        clearTimeout(unoAiTimerRef.current);
        unoAiTimerRef.current = null;
      }
      game.callUno(playerName);
      game.setUnoCallable(null);
      dispatch(setSnapshot(game.getSnapshot()));
      // Re-schedule play timers — callUno fires uno_called/uno_penalty events
      // which don't trigger rescheduling in the onEvent handler.
      scheduleAiPlay();
      scheduleVisitorAutoPlay();
    },
    [dispatch, scheduleAiPlay, scheduleVisitorAutoPlay],
  );

  /** Delay for card-collect animation before re-dealing (ms) */
  const RESTART_COLLECT_DELAY = 800;

  const restartGame = useCallback(() => {
    if (!gameRef.current) return;
    cancelVisitorTimer();
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    if (unoCatchTimerRef.current) clearTimeout(unoCatchTimerRef.current);
    if (unoAiTimerRef.current) clearTimeout(unoAiTimerRef.current);
    aiScheduledRef.current = false;
    gameRef.current = null;
    // Null snapshot triggers useMagnetState to collect cards back to deck
    dispatch(setSnapshot(null));
    dispatch(clearEvents());
    // After cards settle, start a fresh game which triggers dealing animation
    setTimeout(() => startGame(), RESTART_COLLECT_DELAY);
  }, [dispatch, startGame, cancelVisitorTimer]);

  const getGameEndInfo = useCallback((): GameEndInfo | null => {
    return gameRef.current?.getGameEndInfo() ?? null;
  }, []);

  return {
    startGame,
    playCard,
    drawCard,
    passAfterDraw,
    resolveChallenge,
    tryAutoResolveChallenge,
    callUno,
    restartGame,
    getGameEndInfo,
    cancelVisitorTimer,
  };
};
