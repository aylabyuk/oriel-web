import { useRef, useCallback } from 'react';
import { Color } from 'uno-engine';
import { UnoGame } from '@/engine';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSnapshot, pushEvent } from '@/store/slices/game';
import { selectVisitorName } from '@/store/slices/visitor';
import { mulberry32 } from '@/utils/mulberry32';

const AI_OPPONENTS = ['Meio', 'Dong', 'Oscar'] as const;

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
    });

    gameRef.current = game;
    dispatch(setSnapshot(game.getSnapshot()));
  }, [visitorName, dispatch]);

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

  return { startGame, playCard };
};
