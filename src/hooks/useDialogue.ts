import { useRef, useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectEvents, selectSnapshot } from '@/store/slices/game';
import {
  createDialogueSelector,
  findAffectedPlayer,
} from '@/utils/dialogueSelector';
import type {
  AiPersonality,
  DialogueBubble,
  DialogueCategory,
  DialogueHistoryEntry,
} from '@/types/dialogue';
import type { GameEvent, GameSnapshot, SerializedCard } from '@/types/game';
import { Value, Color } from 'uno-engine';
import { fetchJokes } from '@/utils/fetchJokes';

const AI_NAMES: AiPersonality[] = ['Meio', 'Dong', 'Oscar'];
const AI_NAME_SET = new Set<string>(AI_NAMES);
const AI_INDEX: Record<string, number> = { Meio: 1, Dong: 2, Oscar: 3 };

/** Delay after event before first dialogue appears (ms) */
const REACTION_DELAY_BASE = 800;
/** Additional stagger for a second responder (ms) */
const STAGGER_INTERVAL = 1200;
/** How long a dialogue bubble stays visible (ms) */
const BUBBLE_DURATION = 3000;
/** Max AI that react to a single event */
const MAX_REACTORS = 2;
/** How long before AIs comment on visitor being slow (ms) */
const VISITOR_SLOW_THRESHOLD = 6000;
/** Probability that an AI tells a joke on a turn change */
const JOKE_CHANCE = 0.12;
/** Refetch threshold — fetch more jokes when pool drops below this */
const JOKE_REFETCH_THRESHOLD = 3;

/** Joke sequence timing (ms) */
const JOKE_INTRO_DURATION = 2500;
const JOKE_PUNCHLINE_DELAY = 2800;
const JOKE_REACTION_STAGGER = 1500;
const JOKE_REACTION_DURATION = 4000;
/** ms per word for joke read time, with a floor */
const JOKE_MS_PER_WORD = 400;
const JOKE_READ_TIME_MIN = 5000;

/** Estimate how long a joke needs to stay on screen based on word count. */
const jokeReadTime = (text: string): number =>
  Math.max(JOKE_READ_TIME_MIN, text.split(/\s+/).length * JOKE_MS_PER_WORD);

const JOKE_INTROS = [
  'Hey, I got a joke!',
  'Okay okay, listen to this one...',
  'While we wait... wanna hear a joke?',
  "Here's one for you all.",
  'Joke time!',
  'You guys ready for this?',
  'Stop me if you heard this one...',
];

const JOKE_REACTIONS_POSITIVE = [
  'Haha, good one!',
  "LOL that's actually funny!",
  "I'm dead!",
  'Okay I laughed.',
  'That got me ngl.',
  'Classic!',
  'LMAO!',
  'Hahaha nice.',
  'Took me a sec... haha!',
  'Alright, that was good.',
];

const JOKE_REACTIONS_NEGATIVE = [
  'That was terrible.',
  'Not funny.',
  'Boo! Stick to cards.',
  'You are SO corny.',
  'Cringe.',
  "I can't believe I heard that.",
  'Delete that joke.',
  'Wow... just wow.',
  'Heard that one a million times.',
  "That's the worst joke I've ever heard.",
  'Please never tell a joke again.',
];

type Candidate = {
  personality: AiPersonality;
  category: DialogueCategory;
  context: { player?: string; visitor?: string };
};

const COLOR_NAMES: Record<number, string> = {
  [Color.RED]: 'Red',
  [Color.BLUE]: 'Blue',
  [Color.GREEN]: 'Green',
  [Color.YELLOW]: 'Yellow',
};

const VALUE_NAMES: Record<number, string> = {
  [Value.ZERO]: '0',
  [Value.ONE]: '1',
  [Value.TWO]: '2',
  [Value.THREE]: '3',
  [Value.FOUR]: '4',
  [Value.FIVE]: '5',
  [Value.SIX]: '6',
  [Value.SEVEN]: '7',
  [Value.EIGHT]: '8',
  [Value.NINE]: '9',
  [Value.DRAW_TWO]: 'Draw Two',
  [Value.SKIP]: 'Skip',
  [Value.REVERSE]: 'Reverse',
  [Value.WILD]: 'Wild',
  [Value.WILD_DRAW_FOUR]: 'Wild Draw Four',
};

const formatCard = (card: SerializedCard): string => {
  const valueName = VALUE_NAMES[card.value] ?? '?';
  if (card.color == null) return valueName;
  return `${COLOR_NAMES[card.color] ?? ''} ${valueName}`.trim();
};

/** Map a game event to a human-readable action message, or null to skip */
const formatEventAction = (
  event: GameEvent,
  snapshot: GameSnapshot,
): { playerName: string; message: string } | null => {
  switch (event.type) {
    case 'card_played': {
      if (!event.card) return null;
      const trigger = event.data?.trigger as string | undefined;
      const cardName = formatCard(event.card);
      if (
        trigger === 'skip' ||
        trigger === 'draw_two' ||
        trigger === 'wild_draw_four'
      ) {
        const victim = findAffectedPlayer(snapshot);
        if (victim)
          return {
            playerName: event.playerName,
            message: `played ${cardName} on ${victim}`,
          };
      }
      return { playerName: event.playerName, message: `played ${cardName}` };
    }
    case 'card_drawn':
      return { playerName: event.playerName, message: 'drew a card' };
    case 'uno_called':
      return { playerName: event.playerName, message: 'called UNO!' };
    case 'uno_penalty': {
      const count = (event.data?.count as number) ?? 2;
      return {
        playerName: event.playerName,
        message: `caught! Drew ${count} penalty cards`,
      };
    }
    case 'challenge_resolved': {
      const result = event.data?.result as string;
      const bluffer = event.data?.blufferName as string;
      if (result === 'bluff_caught')
        return {
          playerName: bluffer,
          message: 'bluff was caught! Drew 4 cards',
        };
      if (result === 'legit_play')
        return {
          playerName: event.playerName,
          message: 'challenge failed! Drew 6 cards',
        };
      return null;
    }
    case 'game_ended': {
      const score = event.data?.score as number | undefined;
      return {
        playerName: event.playerName,
        message: `won the game${score ? ` with ${score} points` : ''}!`,
      };
    }
    default:
      return null;
  }
};

const isAi = (name: string): name is AiPersonality => AI_NAME_SET.has(name);
const otherAis = (exclude: string): AiPersonality[] =>
  AI_NAMES.filter((n) => n !== exclude);

/** Shuffle array in place (Fisher-Yates) and return it */
const shuffle = <T>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const mapEventToCandidates = (
  event: GameEvent,
  snapshot: GameSnapshot,
  visitorName: string,
): Candidate[] => {
  const candidates: Candidate[] = [];
  const ctx = { visitor: visitorName };

  switch (event.type) {
    case 'card_played': {
      const trigger = event.data?.trigger as string | undefined;
      const victim = findAffectedPlayer(snapshot);

      if (trigger === 'skip') {
        if (victim && isAi(victim)) {
          candidates.push({
            personality: victim,
            category: 'got_skipped',
            context: { ...ctx, player: event.playerName },
          });
        }
        if (isAi(event.playerName)) {
          candidates.push({
            personality: event.playerName,
            category: 'skipped_someone',
            context: { ...ctx, player: victim ?? '' },
          });
        }
        for (const ai of otherAis(event.playerName)) {
          if (ai !== victim) {
            candidates.push({
              personality: ai,
              category: 'opponent_got_skipped',
              context: { ...ctx, player: victim ?? '' },
            });
          }
        }
      }

      if (trigger === 'draw_two') {
        if (victim && isAi(victim)) {
          candidates.push({
            personality: victim,
            category: 'got_draw_two',
            context: { ...ctx, player: event.playerName },
          });
        }
        if (isAi(event.playerName)) {
          candidates.push({
            personality: event.playerName,
            category: 'hit_someone_draw',
            context: { ...ctx, player: victim ?? '' },
          });
        }
        for (const ai of otherAis(event.playerName)) {
          if (ai !== victim) {
            candidates.push({
              personality: ai,
              category: 'opponent_drew_cards',
              context: { ...ctx, player: victim ?? '' },
            });
          }
        }
      }

      if (trigger === 'wild_draw_four') {
        if (victim && isAi(victim)) {
          candidates.push({
            personality: victim,
            category: 'got_draw_four',
            context: { ...ctx, player: event.playerName },
          });
        }
        if (isAi(event.playerName)) {
          candidates.push({
            personality: event.playerName,
            category: 'hit_someone_draw',
            context: { ...ctx, player: victim ?? '' },
          });
        }
      }

      if (trigger === 'reverse' && isAi(event.playerName)) {
        candidates.push({
          personality: event.playerName,
          category: 'played_reverse',
          context: ctx,
        });
      }

      if (trigger === 'wild' && isAi(event.playerName)) {
        candidates.push({
          personality: event.playerName,
          category: 'played_wild',
          context: ctx,
        });
      }
      break;
    }

    case 'card_drawn': {
      if (isAi(event.playerName)) {
        candidates.push({
          personality: event.playerName,
          category: 'drew_card_self',
          context: ctx,
        });
      }
      break;
    }

    case 'uno_called': {
      if (isAi(event.playerName)) {
        candidates.push({
          personality: event.playerName,
          category: 'uno_called_self',
          context: ctx,
        });
      }
      for (const ai of otherAis(event.playerName)) {
        candidates.push({
          personality: ai,
          category: 'uno_called_opponent',
          context: { ...ctx, player: event.playerName },
        });
      }
      break;
    }

    case 'uno_penalty': {
      for (const ai of otherAis(event.playerName)) {
        candidates.push({
          personality: ai,
          category: 'uno_caught',
          context: { ...ctx, player: event.playerName },
        });
      }
      break;
    }

    case 'challenge_resolved': {
      const result = event.data?.result as string;
      if (result === 'accepted') break; // no dialogue for simple accept
      const category: DialogueCategory =
        result === 'bluff_caught'
          ? 'challenge_bluff_caught'
          : 'challenge_legit';
      const blufferName = event.data?.blufferName as string;
      for (const ai of AI_NAMES) {
        candidates.push({
          personality: ai,
          category,
          context: { ...ctx, player: blufferName },
        });
      }
      break;
    }

    case 'game_ended': {
      const winner = event.playerName;
      for (const ai of AI_NAMES) {
        if (ai === winner) {
          candidates.push({
            personality: ai,
            category: 'game_won',
            context: ctx,
          });
        } else if (winner === visitorName) {
          candidates.push({
            personality: ai,
            category: 'visitor_won',
            context: ctx,
          });
        } else {
          candidates.push({
            personality: ai,
            category: 'game_lost',
            context: { ...ctx, player: winner },
          });
        }
      }
      break;
    }

    case 'turn_changed': {
      // Check hand sizes for low_cards / many_cards commentary
      for (const p of snapshot.players) {
        if (p.name === visitorName) continue;
        if (p.hand.length === 2 || p.hand.length === 3) {
          for (const ai of otherAis(p.name)) {
            candidates.push({
              personality: ai,
              category: 'low_cards',
              context: { ...ctx, player: p.name },
            });
          }
        }
        if (p.hand.length >= 10) {
          for (const ai of otherAis(p.name)) {
            candidates.push({
              personality: ai,
              category: 'many_cards',
              context: { ...ctx, player: p.name },
            });
          }
        }
      }
      break;
    }
  }

  return candidates;
};

/** Schedule dialogue lines from selected candidates */
const scheduleDialogues = (
  selected: { personality: AiPersonality; text: string }[],
  baseDelay: number,
  timersRef: React.RefObject<ReturnType<typeof setTimeout>[]>,
  setDialogues: React.Dispatch<React.SetStateAction<(DialogueBubble | null)[]>>,
  setHistory: React.Dispatch<React.SetStateAction<DialogueHistoryEntry[]>>,
) => {
  for (let i = 0; i < selected.length; i++) {
    const { personality, text } = selected[i];
    const delay = baseDelay + i * STAGGER_INTERVAL;
    const idx = AI_INDEX[personality];

    const showTimer = setTimeout(() => {
      setDialogues((prev) => {
        const next = [...prev];
        next[idx] = { message: text, key: Date.now() };
        return next;
      });
      setHistory((prev) => [
        ...prev,
        { kind: 'dialogue', personality, message: text, timestamp: Date.now() },
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

export const useDialogue = () => {
  const events = useAppSelector(selectEvents);
  const snapshot = useAppSelector(selectSnapshot);
  const processedRef = useRef(0);
  const selectorRef = useRef(createDialogueSelector());
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [dialogues, setDialogues] = useState<(DialogueBubble | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [history, setHistory] = useState<DialogueHistoryEntry[]>([]);
  const gameStartedRef = useRef(false);
  const visitorSlowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const jokePoolRef = useRef<string[]>([]);
  const fetchingJokesRef = useRef(false);

  const refillJokes = useCallback(() => {
    if (fetchingJokesRef.current) return;
    fetchingJokesRef.current = true;
    fetchJokes().then((jokes) => {
      jokePoolRef.current.push(...jokes);
      fetchingJokesRef.current = false;
    });
  }, []);

  // Clear all pending timers
  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }, []);

  const clearVisitorSlowTimer = useCallback(() => {
    if (visitorSlowTimerRef.current) {
      clearTimeout(visitorSlowTimerRef.current);
      visitorSlowTimerRef.current = null;
    }
  }, []);

  // Reset on game restart (snapshot goes null)
  useEffect(() => {
    if (snapshot !== null) return;
    clearTimers();
    clearVisitorSlowTimer();
    selectorRef.current.reset();
    processedRef.current = 0;
    gameStartedRef.current = false;
    setDialogues([null, null, null, null]);
    setHistory([]);
  }, [snapshot, clearTimers, clearVisitorSlowTimer]);

  // Game started dialogue — fires once when snapshot first appears
  useEffect(() => {
    if (!snapshot || gameStartedRef.current) return;
    gameStartedRef.current = true;
    refillJokes();

    const now = Date.now();
    const visitorName = snapshot.players[0]?.name ?? 'Player';
    const ctx = { visitor: visitorName };
    const candidates = shuffle(
      AI_NAMES.map((ai) => ({
        personality: ai,
        category: 'game_started' as DialogueCategory,
        context: ctx,
      })),
    );

    const selected: { personality: AiPersonality; text: string }[] = [];
    for (const c of candidates) {
      if (selected.length >= MAX_REACTORS) break;
      const text = selectorRef.current.selectLine(
        c.personality,
        c.category,
        c.context,
        now,
      );
      if (text) selected.push({ personality: c.personality, text });
    }

    // Longer initial delay so the game has time to settle visually
    scheduleDialogues(selected, 1500, timersRef, setDialogues, setHistory);
  }, [snapshot]);

  // Visitor slow timer — when it's the visitor's turn, start a countdown
  useEffect(() => {
    clearVisitorSlowTimer();

    if (!snapshot) return;
    const visitorName = snapshot.players[0]?.name;
    if (!visitorName || snapshot.currentPlayerName !== visitorName) return;

    visitorSlowTimerRef.current = setTimeout(() => {
      const now = Date.now();
      const ctx = { visitor: visitorName };
      const candidates = shuffle(
        AI_NAMES.map((ai) => ({
          personality: ai,
          category: 'visitor_slow' as DialogueCategory,
          context: ctx,
        })),
      );

      const selected: { personality: AiPersonality; text: string }[] = [];
      for (const c of candidates) {
        if (selected.length >= 1) break; // Only 1 reactor for slow comments
        const text = selectorRef.current.selectLine(
          c.personality,
          c.category,
          c.context,
          now,
        );
        if (text) selected.push({ personality: c.personality, text });
      }

      scheduleDialogues(selected, 0, timersRef, setDialogues, setHistory);
    }, VISITOR_SLOW_THRESHOLD);

    return () => clearVisitorSlowTimer();
  }, [snapshot?.currentPlayerName, snapshot, clearVisitorSlowTimer]);

  // Process new events
  useEffect(() => {
    if (!snapshot || events.length <= processedRef.current) return;

    const newEvents = events.slice(processedRef.current);
    processedRef.current = events.length;
    const now = Date.now();
    const visitorName = snapshot.players[0]?.name ?? 'Player';

    for (const event of newEvents) {
      // Log game action to history
      const action = formatEventAction(event, snapshot);
      if (action) {
        setHistory((prev) => [
          ...prev,
          {
            kind: 'action',
            playerName: action.playerName,
            message: action.message,
            timestamp: Date.now(),
          },
        ]);
      }

      const candidates = mapEventToCandidates(event, snapshot, visitorName);
      if (candidates.length === 0) continue;

      // Shuffle so the same AI doesn't always react first
      shuffle(candidates);

      let reactorCount = 0;
      const selected: { personality: AiPersonality; text: string }[] = [];

      for (const c of candidates) {
        if (reactorCount >= MAX_REACTORS) break;
        // Skip if this personality already selected for this event
        if (selected.some((s) => s.personality === c.personality)) continue;

        const text = selectorRef.current.selectLine(
          c.personality,
          c.category,
          c.context,
          now,
        );
        if (text) {
          selected.push({ personality: c.personality, text });
          reactorCount++;
        }
      }

      scheduleDialogues(
        selected,
        REACTION_DELAY_BASE,
        timersRef,
        setDialogues,
        setHistory,
      );

      // Occasionally have an AI tell a joke on turn changes
      if (
        event.type === 'turn_changed' &&
        jokePoolRef.current.length > 0 &&
        Math.random() < JOKE_CHANCE
      ) {
        const joke = jokePoolRef.current.pop()!;
        const teller = AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)];
        const reactors = otherAis(teller);
        const baseT =
          REACTION_DELAY_BASE + selected.length * STAGGER_INTERVAL + 400;
        const tellerIdx = AI_INDEX[teller];
        const intro =
          JOKE_INTROS[Math.floor(Math.random() * JOKE_INTROS.length)];

        // Phase 1 — Intro: "Hey, I got a joke!"
        const introShow = setTimeout(() => {
          setDialogues((prev) => {
            const n = [...prev];
            n[tellerIdx] = { message: intro, key: Date.now() };
            return n;
          });
          setHistory((prev) => [
            ...prev,
            {
              kind: 'dialogue',
              personality: teller,
              message: intro,
              timestamp: Date.now(),
            },
          ]);
        }, baseT);
        const introHide = setTimeout(() => {
          setDialogues((prev) => {
            const n = [...prev];
            n[tellerIdx] = null;
            return n;
          });
        }, baseT + JOKE_INTRO_DURATION);

        // Phase 2 — Punchline: stays on screen based on word count
        const readTime = jokeReadTime(joke);
        const jokeStart = baseT + JOKE_PUNCHLINE_DELAY;
        const jokeShow = setTimeout(() => {
          setDialogues((prev) => {
            const n = [...prev];
            n[tellerIdx] = { message: joke, key: Date.now() };
            return n;
          });
          setHistory((prev) => [
            ...prev,
            {
              kind: 'dialogue',
              personality: teller,
              message: joke,
              timestamp: Date.now(),
            },
          ]);
        }, jokeStart);
        // Joke hides when first reaction appears
        const reactionsStart = jokeStart + readTime;
        const jokeHide = setTimeout(() => {
          setDialogues((prev) => {
            const n = [...prev];
            n[tellerIdx] = null;
            return n;
          });
        }, reactionsStart);

        // Phase 3 — Reactions from other AIs (after read time)
        for (let r = 0; r < reactors.length; r++) {
          const reactor = reactors[r];
          const pool =
            Math.random() < 0.5
              ? JOKE_REACTIONS_POSITIVE
              : JOKE_REACTIONS_NEGATIVE;
          const line = pool[Math.floor(Math.random() * pool.length)];
          const rIdx = AI_INDEX[reactor];
          const rDelay = reactionsStart + r * JOKE_REACTION_STAGGER;

          const rShow = setTimeout(() => {
            setDialogues((prev) => {
              const n = [...prev];
              n[rIdx] = { message: line, key: Date.now() };
              return n;
            });
            setHistory((prev) => [
              ...prev,
              {
                kind: 'dialogue',
                personality: reactor,
                message: line,
                timestamp: Date.now(),
              },
            ]);
          }, rDelay);
          const rHide = setTimeout(() => {
            setDialogues((prev) => {
              const n = [...prev];
              n[rIdx] = null;
              return n;
            });
          }, rDelay + JOKE_REACTION_DURATION);

          timersRef.current.push(rShow, rHide);
        }

        timersRef.current.push(introShow, introHide, jokeShow, jokeHide);
        if (jokePoolRef.current.length < JOKE_REFETCH_THRESHOLD) refillJokes();
      }
    }
  }, [events, snapshot, refillJokes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      clearVisitorSlowTimer();
    };
  }, [clearTimers, clearVisitorSlowTimer]);

  return { dialogues, history };
};
