import type { AiPersonality } from '@/constants/players';

export type { AiPersonality };

export type DialogueCategory =
  | 'got_skipped'
  | 'got_draw_two'
  | 'got_draw_four'
  | 'skipped_someone'
  | 'hit_someone_draw'
  | 'played_reverse'
  | 'played_wild'
  | 'opponent_got_skipped'
  | 'opponent_drew_cards'
  | 'uno_called_self'
  | 'uno_called_opponent'
  | 'uno_caught'
  | 'challenge_bluff_caught'
  | 'challenge_legit'
  | 'game_won'
  | 'game_lost'
  | 'visitor_won'
  | 'low_cards'
  | 'many_cards'
  | 'game_started'
  | 'visitor_slow'
  | 'drew_card_self';

export type DialogueLine = {
  text: string;
  /** Probability weight — higher = more likely. Default 1. */
  weight?: number;
};

export type DialogueBubble = {
  message: string;
  /** Unique key for CSS animation resets */
  key: number;
};

export type DialogueHistoryEntry =
  | {
      kind: 'dialogue';
      personality: AiPersonality;
      message: string;
      timestamp: number;
    }
  | { kind: 'action'; playerName: string; message: string; timestamp: number }
  | { kind: 'shout'; playerName: string; message: string; timestamp: number };
