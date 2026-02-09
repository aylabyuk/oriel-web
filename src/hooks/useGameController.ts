import { useRef, useCallback, useEffect } from 'react';
import { Color } from 'uno-engine';
import { UnoGame } from '@/engine';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSnapshot, pushEvent } from '@/store/slices/game';
import { selectVisitorName } from '@/store/slices/visitor';

const AI_OPPONENTS = ['Meio', 'Dong', 'Oscar'] as const;
const WILD_COLORS = [Color.RED, Color.BLUE, Color.GREEN, Color.YELLOW] as const;
const AI_DELAY_MS = 1200;

export const useGameController = () => {
  const dispatch = useAppDispatch();
  const visitorName = useAppSelector(selectVisitorName);
  const gameRef = useRef<UnoGame | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const humanNameRef = useRef(visitorName || 'Player');
  humanNameRef.current = visitorName || 'Player';

  const doAITurnRef = useRef<() => void>(() => {});

  doAITurnRef.current = () => {
    const game = gameRef.current;
    if (!game) return;

    const currentName = game.getCurrentPlayerName();
    if (currentName === humanNameRef.current) return;

    const playable = game.getPlayableCardsForPlayer(currentName);
    if (playable.length > 0) {
      const card = playable[Math.floor(Math.random() * playable.length)];
      const chosenColor = card.isWildCard()
        ? WILD_COLORS[Math.floor(Math.random() * WILD_COLORS.length)]
        : undefined;
      try {
        game.playCard(card, chosenColor);
      } catch {
        try {
          game.draw();
          game.pass();
        } catch {
          // Engine rejected draw/pass — game may be stuck
        }
      }
    } else {
      try {
        game.draw();
        game.pass();
      } catch {
        // Engine rejected draw/pass — game may be stuck
      }
    }

    // After playing, check if the next player is also AI
    const nextName = game.getCurrentPlayerName();
    if (nextName !== humanNameRef.current) {
      aiTimerRef.current = setTimeout(() => doAITurnRef.current(), AI_DELAY_MS);
    }
  };

  const scheduleAIIfNeeded = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    const currentName = game.getCurrentPlayerName();
    if (currentName === humanNameRef.current) return;

    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    aiTimerRef.current = setTimeout(() => doAITurnRef.current(), AI_DELAY_MS);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, []);

  const startGame = useCallback(() => {
    if (gameRef.current) return;

    const playerNames = [visitorName || 'Player', ...AI_OPPONENTS];
    const game = new UnoGame(playerNames, playerNames[0]);

    game.onEvent((event) => {
      dispatch(pushEvent(event));
      dispatch(setSnapshot(game.getSnapshot()));
    });

    gameRef.current = game;
    dispatch(setSnapshot(game.getSnapshot()));

    // If the initial player is AI, schedule their turn
    scheduleAIIfNeeded();
  }, [visitorName, dispatch, scheduleAIIfNeeded]);

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

    // After visitor plays, schedule AI if next player is AI
    scheduleAIIfNeeded();
  }, [visitorName, scheduleAIIfNeeded]);

  return { startGame, playCard };
};
