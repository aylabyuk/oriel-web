import { useRef, useCallback } from 'react';
import { Color } from 'uno-engine';
import { UnoGame } from '@/engine';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSnapshot, pushEvent } from '@/store/slices/game';
import { selectVisitorName } from '@/store/slices/visitor';

const AI_OPPONENTS = ['Meio', 'Dong', 'Oscar'] as const;

export const useGameController = () => {
  const dispatch = useAppDispatch();
  const visitorName = useAppSelector(selectVisitorName);
  const gameRef = useRef<UnoGame | null>(null);

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
