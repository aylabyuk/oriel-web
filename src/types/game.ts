import type { Card, Color, Value } from 'uno-engine';

export type CardColor = 'red' | 'blue' | 'green' | 'yellow';
export type CardType =
  | 'number'
  | 'skip'
  | 'reverse'
  | 'draw_two'
  | 'wild'
  | 'wild_draw_four';

export type SerializedCard = {
  value: Value;
  color: Color | undefined;
  id: string;
};

export type SerializedPlayer = {
  name: string;
  cardCount: number;
  hand: SerializedCard[];
};

export type PlayDirection = 'clockwise' | 'counter_clockwise';

export type GamePhase = 'idle' | 'playing' | 'choosing_color' | 'ended';

export type GameSnapshot = {
  phase: GamePhase;
  currentPlayerName: string;
  players: SerializedPlayer[];
  discardPile: SerializedCard[];
  direction: PlayDirection;
  drawPile: SerializedCard[];
  winner: string | null;
  score: number | null;
  playableCardIds: string[];
};

export type GameEventType =
  | 'card_played'
  | 'card_drawn'
  | 'player_passed'
  | 'direction_reversed'
  | 'player_skipped'
  | 'uno_called'
  | 'game_ended'
  | 'turn_changed';

export type GameEvent = {
  type: GameEventType;
  playerName: string;
  card?: SerializedCard;
  data?: Record<string, unknown>;
};

export type GameEventListener = (event: GameEvent) => void;

/** Dialogue trigger types mapped to card effects */
export type DialogueTrigger =
  | 'draw_two'
  | 'skip'
  | 'reverse'
  | 'wild'
  | 'wild_draw_four'
  | 'number'
  | 'uno'
  | 'game_end';

export type { Card, Color, Value };
