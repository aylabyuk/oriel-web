import { useRef, useCallback, useEffect } from 'react';
import { Color } from 'uno-engine';
import { UnoGame, getCardId } from '@/engine';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSnapshot, pushEvent } from '@/store/slices/game';
import { selectVisitorName } from '@/store/slices/visitor';
import { mulberry32 } from '@/utils/mulberry32';

const AI_OPPONENTS = ['Meio', 'Dong', 'Oscar'] as const;
const AI_NAMES = new Set<string>(AI_OPPONENTS);

/** Delay for the card-play animation to finish before next AI move */
const AI_ANIMATION_WAIT = 1500;
/** Random additional "thinking" delay range (ms) */
const AI_THINK_MIN = 500;
const AI_THINK_MAX = 1500;

const ALL_COLORS = [Color.RED, Color.BLUE, Color.GREEN, Color.YELLOW];

/**
 * Dev-only: set to a number for deterministic games (same seed = same deal,
 * same starting player, etc.). Set to `null` for normal random behavior.
 * Change the seed to explore different game scenarios.
 */
const DEV_SEED: number | null = 42;

export const useGameController = () => {
  const dispatch = useAppDispatch();
  const visitorName = useAppSelector(selectVisitorName);
  const gameRef = useRef<UnoGame | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiScheduledRef = useRef(false);

  const scheduleAiPlay = useCallback(() => {
    const game = gameRef.current;
    if (!game || aiScheduledRef.current) {
      return;
    }

    const currentPlayer = game.getCurrentPlayerName();
    if (!AI_NAMES.has(currentPlayer)) {
      return;
    }

    aiScheduledRef.current = true;
    const thinkDelay = AI_THINK_MIN + Math.random() * (AI_THINK_MAX - AI_THINK_MIN);
    const totalDelay = AI_ANIMATION_WAIT + thinkDelay;

    aiTimerRef.current = setTimeout(() => {
      aiScheduledRef.current = false;
      const g = gameRef.current;
      if (!g) return;

      const playerName = g.getCurrentPlayerName();
      if (!AI_NAMES.has(playerName)) {
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

  // Clean up AI timer on unmount
  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, []);

  const startGame = useCallback(() => {
    if (gameRef.current) return;

    // Temporarily replace Math.random with a seeded PRNG so the
    // uno-engine deck shuffle + starting-player pick are deterministic.
    const originalRandom = Math.random;
    if (DEV_SEED !== null) {
      Math.random = mulberry32(DEV_SEED);
    }

    const playerNames = [visitorName || 'Player', ...AI_OPPONENTS];
    const game = new UnoGame(playerNames, playerNames[0]);

    // Restore original Math.random immediately after construction.
    Math.random = originalRandom;

    game.onEvent((event) => {
      dispatch(pushEvent(event));
      dispatch(setSnapshot(game.getSnapshot()));

      // After any event, check if it's an AI's turn and schedule their play
      if (event.type === 'turn_changed' || event.type === 'card_played') {
        scheduleAiPlay();
      }
    });

    gameRef.current = game;
    dispatch(setSnapshot(game.getSnapshot()));

    // If the first player is AI, kick off their play
    scheduleAiPlay();
  }, [visitorName, dispatch, scheduleAiPlay]);

  const playCard = useCallback((cardId: string, chosenColor?: Color) => {
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
  }, [visitorName]);

  const drawCard = useCallback((): { cardId: string; isPlayable: boolean; isWild: boolean } | null => {
    const game = gameRef.current;
    if (!game) return null;
    const playerName = visitorName || 'Player';
    if (game.getCurrentPlayerName() !== playerName) return null;

    const handBefore = new Set(game.getPlayerHand(playerName).map((c) => getCardId(c)));
    game.draw();

    const drawnCard = game.getPlayerHand(playerName).find((c) => !handBefore.has(getCardId(c)));
    if (!drawnCard) return null;

    const cardId = getCardId(drawnCard);
    const isWild = drawnCard.isWildCard();
    const isPlayable = game.getPlayableCards().some((c) => getCardId(c) === cardId);
    return { cardId, isPlayable, isWild };
  }, [visitorName]);

  const passAfterDraw = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    game.pass();
  }, []);

  return { startGame, playCard, drawCard, passAfterDraw };
};
