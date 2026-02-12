import { DIALOGUE_LINES } from '@/data/dialogueLines';
import type { AiPersonality, DialogueCategory } from '@/types/dialogue';
import type { GameSnapshot } from '@/types/game';
import {
  AI_STRATEGIST,
  AI_TRASH_TALKER,
  AI_CHILL,
} from '@/constants/players';
import {
  CATEGORY_PROBABILITY,
  HISTORY_SIZE,
  COOLDOWN_MS,
  COOLDOWN_BYPASS,
} from './dialogueSelector.constants';

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
    history: { [AI_STRATEGIST]: [], [AI_TRASH_TALKER]: [], [AI_CHILL]: [] },
    lastTime: { [AI_STRATEGIST]: 0, [AI_TRASH_TALKER]: 0, [AI_CHILL]: 0 },
  };

  const selectLine = (
    personality: AiPersonality,
    category: DialogueCategory,
    context: LineContext,
    now: number,
  ): string | null => {
    if (!COOLDOWN_BYPASS.has(category) && now - state.lastTime[personality] < COOLDOWN_MS) return null;
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
    state.history = { [AI_STRATEGIST]: [], [AI_TRASH_TALKER]: [], [AI_CHILL]: [] };
    state.lastTime = { [AI_STRATEGIST]: 0, [AI_TRASH_TALKER]: 0, [AI_CHILL]: 0 };
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
  const affectedIdx = (((currentIdx + dirStep) % N) + N) % N;
  return snapshot.players[affectedIdx]?.name ?? null;
};
