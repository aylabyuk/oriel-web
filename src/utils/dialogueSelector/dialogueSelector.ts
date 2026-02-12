import { DIALOGUE_LINES } from '@/data/dialogueLines';
import type { AiPersonality, DialogueCategory } from '@/types/dialogue';
import type { GameSnapshot } from '@/types/game';
import { AI_STRATEGIST, AI_TRASH_TALKER, AI_CHILL } from '@/constants/players';
import {
  CATEGORY_PROBABILITY,
  HISTORY_SIZE,
  COOLDOWN_MS,
  COOLDOWN_BYPASS,
} from './dialogueSelector.constants';

type SelectorState = {
  history: Record<AiPersonality, string[]>;
  lastTime: Record<AiPersonality, number>;
  /** Topic keys that have already been shown (via topic threads or banter). */
  shownTopicKeys: Set<string>;
};

type LineContext = {
  player?: string;
  visitor?: string;
};

export const createDialogueSelector = () => {
  const state: SelectorState = {
    history: { [AI_STRATEGIST]: [], [AI_TRASH_TALKER]: [], [AI_CHILL]: [] },
    lastTime: { [AI_STRATEGIST]: 0, [AI_TRASH_TALKER]: 0, [AI_CHILL]: 0 },
    shownTopicKeys: new Set(),
  };

  const selectLine = (
    personality: AiPersonality,
    category: DialogueCategory,
    context: LineContext,
    now: number,
  ): string | null => {
    if (
      !COOLDOWN_BYPASS.has(category) &&
      now - state.lastTime[personality] < COOLDOWN_MS
    )
      return null;
    if (Math.random() > CATEGORY_PROBABILITY[category]) return null;

    const lines = DIALOGUE_LINES[personality][category];
    if (!lines || lines.length === 0) return null;

    const recent = new Set(state.history[personality]);
    const candidates = lines.filter(
      (l) =>
        !recent.has(l.text) &&
        (!l.topicKey || !state.shownTopicKeys.has(l.topicKey)),
    );
    const pool =
      candidates.length > 0
        ? candidates
        : lines.filter(
            (l) => !l.topicKey || !state.shownTopicKeys.has(l.topicKey),
          );
    if (pool.length === 0) return null;

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

    // Mark the topic key as shown so the same fact doesn't resurface
    if (selected.topicKey) {
      state.shownTopicKeys.add(selected.topicKey);
    }

    return text;
  };

  /** Mark a topic key as shown (called when a topic thread plays). */
  const markTopicShown = (key: string) => {
    state.shownTopicKeys.add(key);
  };

  /** Check if a topic key has already been shown. */
  const isTopicShown = (key: string): boolean => state.shownTopicKeys.has(key);

  const reset = () => {
    state.history = {
      [AI_STRATEGIST]: [],
      [AI_TRASH_TALKER]: [],
      [AI_CHILL]: [],
    };
    state.lastTime = {
      [AI_STRATEGIST]: 0,
      [AI_TRASH_TALKER]: 0,
      [AI_CHILL]: 0,
    };
    state.shownTopicKeys.clear();
  };

  return { selectLine, markTopicShown, isTopicShown, reset };
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
  const affectedIdx = (((currentIdx + dirStep) % N) + N) % N;
  return snapshot.players[affectedIdx]?.name ?? null;
};
