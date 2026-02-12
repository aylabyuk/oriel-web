import type {
  AiPersonality,
  DialogueBubble,
  DialogueHistoryEntry,
} from '@/types/dialogue';
import { playChat } from '@/utils/sounds';
import {
  AI_INDEX,
  STAGGER_INTERVAL,
  BUBBLE_DURATION,
} from './useDialogue.constants';

/** Schedule dialogue lines from selected candidates */
export const scheduleDialogues = (
  selected: { personality: AiPersonality; text: string }[],
  baseDelay: number,
  timersRef: React.RefObject<ReturnType<typeof setTimeout>[]>,
  setDialogues: React.Dispatch<React.SetStateAction<(DialogueBubble | null)[]>>,
  setHistory: React.Dispatch<React.SetStateAction<DialogueHistoryEntry[]>>,
  threadId?: string,
) => {
  for (let i = 0; i < selected.length; i++) {
    const { personality, text } = selected[i];
    const delay = baseDelay + i * STAGGER_INTERVAL;
    const idx = AI_INDEX[personality];

    const showTimer = setTimeout(() => {
      playChat(personality);
      setDialogues((prev) => {
        const next = [...prev];
        next[idx] = { message: text, key: Date.now() };
        return next;
      });
      setHistory((prev) => [
        ...prev,
        {
          kind: 'dialogue',
          personality,
          message: text,
          timestamp: Date.now(),
          ...(threadId && { threadId }),
        },
      ]);
    }, delay);

    const hideTimer = setTimeout(() => {
      setDialogues((prev) => {
        const next = [...prev];
        next[idx] = null;
        return next;
      });
    }, delay + BUBBLE_DURATION);

    timersRef.current.push(showTimer, hideTimer);
  }
};
