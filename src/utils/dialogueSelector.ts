import { DIALOGUE_LINES } from '@/data/dialogueLines';
import type { AiPersonality, DialogueCategory } from '@/types/dialogue';
import type { GameSnapshot } from '@/types/game';

/** Per-category probability that a candidate AI actually speaks (0–1) */
const CATEGORY_PROBABILITY: Record<DialogueCategory, number> = {
  got_skipped: 0.9,
  got_draw_two: 0.85,
  got_draw_four: 0.95,
  skipped_someone: 0.6,
  hit_someone_draw: 0.7,
  played_reverse: 0.4,
  played_wild: 0.3,
  opponent_got_skipped: 0.3,
  opponent_drew_cards: 0.25,
  uno_called_self: 0.8,
  uno_called_opponent: 0.7,
  uno_caught: 0.9,
  challenge_bluff_caught: 0.95,
  challenge_legit: 0.85,
  game_won: 1.0,
  game_lost: 0.9,
  visitor_won: 1.0,
  low_cards: 0.4,
  many_cards: 0.3,
  game_started: 1.0,
  visitor_slow: 0.7,
  drew_card_self: 0.35,
};

/** How many recent lines to track per personality to avoid repeats */
const HISTORY_SIZE = 5;
/** Minimum cooldown between dialogue lines from the same AI (ms) */
const COOLDOWN_MS = 4000;

type SelectorState = {
  history: Record<AiPersonality, string[]>;
  lastTime: Record<AiPersonality, number>;
};

type LineContext = {
  player?: string;
  visitor?: string;
};

export const createDialogueSelector = () => {
  const state: SelectorState = {
    history: { Meio: [], Dong: [], Oscar: [] },
    lastTime: { Meio: 0, Dong: 0, Oscar: 0 },
  };

  const selectLine = (
    personality: AiPersonality,
    category: DialogueCategory,
    context: LineContext,
    now: number,
  ): string | null => {
    if (now - state.lastTime[personality] < COOLDOWN_MS) return null;
    if (Math.random() > CATEGORY_PROBABILITY[category]) return null;

    const lines = DIALOGUE_LINES[personality][category];
    if (!lines || lines.length === 0) return null;

    const recent = new Set(state.history[personality]);
    const candidates = lines.filter((l) => !recent.has(l.text));
    const pool = candidates.length > 0 ? candidates : lines;

    const totalWeight = pool.reduce((sum, l) => sum + (l.weight ?? 1), 0);
    let roll = Math.random() * totalWeight;
    let selected = pool[0];
    for (const line of pool) {
      roll -= line.weight ?? 1;
      if (roll <= 0) {
        selected = line;
        break;
      }
    }

    let text = selected.text;
    if (context.player) text = text.split('{player}').join(context.player);
    if (context.visitor) text = text.split('{visitor}').join(context.visitor);
    text = text.split('{speaker}').join(personality);

    state.history[personality].push(selected.text);
    if (state.history[personality].length > HISTORY_SIZE) {
      state.history[personality].shift();
    }
    state.lastTime[personality] = now;

    return text;
  };

  const reset = () => {
    state.history = { Meio: [], Dong: [], Oscar: [] };
    state.lastTime = { Meio: 0, Dong: 0, Oscar: 0 };
  };

  return { selectLine, reset };
};

/**
 * Find the player affected by the last action card (skip, +2, +4).
 * The snapshot's `currentPlayerName` is the player AFTER the effect,
 * so we step backward in play direction to find the victim.
 */
export const findAffectedPlayer = (snapshot: GameSnapshot): string | null => {
  const N = snapshot.players.length;
  const currentIdx = snapshot.players.findIndex(
    (p) => p.name === snapshot.currentPlayerName,
  );
  if (currentIdx < 0) return null;
  const dirStep = snapshot.direction === 'clockwise' ? -1 : 1;
  const affectedIdx = ((currentIdx + dirStep) % N + N) % N;
  return snapshot.players[affectedIdx]?.name ?? null;
};
