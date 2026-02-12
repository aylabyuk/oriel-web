import type { DialogueCategory } from '@/types/dialogue';

/** Per-category probability that a candidate AI actually speaks (0–1) */
export const CATEGORY_PROBABILITY: Record<DialogueCategory, number> = {
  got_skipped: 0.9,
  got_draw_two: 0.85,
  got_draw_four: 0.95,
  skipped_someone: 0.7,
  hit_someone_draw: 0.75,
  played_reverse: 0.55,
  played_wild: 0.45,
  opponent_got_skipped: 0.45,
  opponent_drew_cards: 0.4,
  uno_called_self: 1.0,
  uno_called_opponent: 0.7,
  uno_caught: 0.9,
  challenge_bluff_caught: 0.95,
  challenge_legit: 0.85,
  game_won: 1.0,
  game_lost: 0.9,
  visitor_won: 1.0,
  low_cards: 0.5,
  many_cards: 0.4,
  game_started: 1.0,
  visitor_slow: 0.7,
  drew_card_self: 0.5,
  idle: 0.2,
  personal_info: 1.0,
};

/** How many recent lines to track per personality to avoid repeats */
export const HISTORY_SIZE = 12;
/** Minimum cooldown between dialogue lines from the same AI (ms) */
export const COOLDOWN_MS = 2500;
/** Categories that ignore cooldown — must always fire */
export const COOLDOWN_BYPASS: Set<DialogueCategory> = new Set([
  'uno_called_self',
  'personal_info',
]);
