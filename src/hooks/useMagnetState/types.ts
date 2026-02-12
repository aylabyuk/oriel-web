import type { SerializedCard, PlayDirection } from '@/types/game';

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
  /** Index of the player whose card is being animated to the discard pile (-1 = none) */
  playingPlayerIndex: number;
  /** Card ID selected for play — neighbors spread apart during play_gap phase */
  selectedCardId: string | null;
  /** Card ID currently lifting out of hand — rendered with lift placement */
  liftingCardId: string | null;
  /** Play direction — deferred during animation so it updates when the card lands */
  direction: PlayDirection;
  /** Current player name — deferred during animation so it updates when the card lands */
  currentPlayerName: string | null;
  /** Cards in transit from deck to a player's hand */
  drawFloat: SerializedCard[];
  /** Index of the player receiving drawn cards (-1 = none) */
  drawingPlayerIndex: number;
  /** Sorted insertion index where the drawn card will land in the hand */
  drawInsertIndex: number;
};

export type MagnetPhase =
  | 'idle'
  | 'dealing'
  | 'revealing'
  | 'spreading'
  | 'discard_lift'
  | 'discard_flip'
  | 'discard_move'
  | 'play_gap'
  | 'play_lift'
  | 'play_move'
  | 'play_rotate'
  | 'draw_lift'
  | 'draw_move'
  | 'draw_gap'
  | 'draw_drop'
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
  | { type: 'play_gap'; cardId: string; playerIndex: number }
  | { type: 'play_lift'; cardId: string; playerIndex: number }
  | { type: 'play_move' }
  | { type: 'play_rotate' }
  | { type: 'play_drop' }
  | { type: 'draw_lift'; cardId: string; playerIndex: number }
  | { type: 'draw_move' }
  | { type: 'draw_gap'; insertIndex: number }
  | { type: 'draw_drop' }
  | {
      type: 'phase';
      phase: MagnetPhase;
      currentPlayerName?: string | null;
      direction?: PlayDirection;
    };
