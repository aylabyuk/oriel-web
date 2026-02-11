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
import { fetchJokes } from '@/utils/fetchJokes';
import type { Joke } from '@/utils/fetchJokes';
import { AI_NAMES, AI_NAME_SET, toDisplayName } from '@/constants/players';
import {
  AI_INDEX,
  REACTION_DELAY_BASE,
  STAGGER_INTERVAL,
  BUBBLE_DURATION,
  MAX_REACTORS,
  VISITOR_SLOW_THRESHOLD,
  JOKE_CHANCE,
  JOKE_REFETCH_THRESHOLD,
  JOKE_INTRO_DURATION,
  JOKE_GO_AHEAD_DELAY,
  JOKE_GO_AHEAD_DURATION,
  JOKE_PUNCHLINE_DELAY,
  JOKE_SETUP_TO_PUNCHLINE_DELAY,
  JOKE_QUESTION_PROMPT_DELAY,
  JOKE_QUESTION_PROMPT_DURATION,
  JOKE_REACTION_STAGGER,
  JOKE_REACTION_DURATION,
  jokeReadTime,
  MAX_JOKE_WORDS,
  JOKE_INTROS,
  JOKE_GO_AHEAD_LINES,
  detectQuestionWord,
  JOKE_QUESTION_RESPONSES,
  JOKE_REACTIONS_POSITIVE,
  JOKE_REACTIONS_NEGATIVE,
  COLOR_NAMES,
  VALUE_NAMES,
} from './useDialogue.constants';

type Candidate = {
  personality: AiPersonality;
  category: DialogueCategory;
  context: { player?: string; visitor?: string };
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
  const name = toDisplayName(event.playerName);
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
            playerName: name,
            message: `played ${cardName} on ${toDisplayName(victim)}`,
          };
      }
      return { playerName: name, message: `played ${cardName}` };
    }
    case 'card_drawn':
      return { playerName: name, message: 'drew a card' };
    case 'uno_called':
      return { playerName: name, message: 'called UNO!' };
    case 'uno_penalty': {
      const count = (event.data?.count as number) ?? 2;
      return {
        playerName: name,
        message: `caught! Drew ${count} penalty cards`,
      };
    }
    case 'challenge_resolved': {
      const result = event.data?.result as string;
      const bluffer = toDisplayName(event.data?.blufferName as string);
      if (result === 'bluff_caught')
        return {
          playerName: bluffer,
          message: 'bluff was caught! Drew 4 cards',
        };
      if (result === 'legit_play')
        return {
          playerName: name,
          message: 'challenge failed! Drew 6 cards',
        };
      return null;
    }
    case 'game_ended': {
      const score = event.data?.score as number | undefined;
      return {
        playerName: name,
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
  const displayName = toDisplayName(visitorName);
  const ctx = { visitor: displayName };
  const withPlayer = (name: string) => ({
    ...ctx,
    player: toDisplayName(name),
  });

  switch (event.type) {
    case 'card_played': {
      const trigger = event.data?.trigger as string | undefined;
      const victim = findAffectedPlayer(snapshot);

      if (trigger === 'skip') {
        if (victim && isAi(victim)) {
          candidates.push({
            personality: victim,
            category: 'got_skipped',
            context: withPlayer(event.playerName),
          });
        }
        if (isAi(event.playerName)) {
          candidates.push({
            personality: event.playerName,
            category: 'skipped_someone',
            context: withPlayer(victim ?? ''),
          });
        }
        for (const ai of otherAis(event.playerName)) {
          if (ai !== victim) {
            candidates.push({
              personality: ai,
              category: 'opponent_got_skipped',
              context: withPlayer(victim ?? ''),
            });
          }
        }
      }

      if (trigger === 'draw_two') {
        if (victim && isAi(victim)) {
          candidates.push({
            personality: victim,
            category: 'got_draw_two',
            context: withPlayer(event.playerName),
          });
        }
        if (isAi(event.playerName)) {
          candidates.push({
            personality: event.playerName,
            category: 'hit_someone_draw',
            context: withPlayer(victim ?? ''),
          });
        }
        for (const ai of otherAis(event.playerName)) {
          if (ai !== victim) {
            candidates.push({
              personality: ai,
              category: 'opponent_drew_cards',
              context: withPlayer(victim ?? ''),
            });
          }
        }
      }

      if (trigger === 'wild_draw_four') {
        if (victim && isAi(victim)) {
          candidates.push({
            personality: victim,
            category: 'got_draw_four',
            context: withPlayer(event.playerName),
          });
        }
        if (isAi(event.playerName)) {
          candidates.push({
            personality: event.playerName,
            category: 'hit_someone_draw',
            context: withPlayer(victim ?? ''),
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
          context: withPlayer(event.playerName),
        });
      }
      break;
    }

    case 'uno_penalty': {
      for (const ai of otherAis(event.playerName)) {
        candidates.push({
          personality: ai,
          category: 'uno_caught',
          context: withPlayer(event.playerName),
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
          context: withPlayer(blufferName),
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
            context: withPlayer(winner),
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
              context: withPlayer(p.name),
            });
          }
        }
        if (p.hand.length >= 10) {
          for (const ai of otherAis(p.name)) {
            candidates.push({
              personality: ai,
              category: 'many_cards',
              context: withPlayer(p.name),
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

export const useDialogue = (ready: boolean) => {
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
  const jokePoolRef = useRef<Joke[]>([]);
  const jokeActiveRef = useRef(false);
  const fetchingJokesRef = useRef(false);

  const refillJokes = useCallback(() => {
    if (fetchingJokesRef.current) return;
    fetchingJokesRef.current = true;
    fetchJokes().then((jokes) => {
      const short = jokes.filter((j) => {
        const words =
          j.setup.split(/\s+/).length +
          (j.punchline?.split(/\s+/).length ?? 0);
        return words <= MAX_JOKE_WORDS;
      });
      jokePoolRef.current.push(...short);
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
    jokeActiveRef.current = false;
    setDialogues([null, null, null, null]);
    setHistory([]);
  }, [snapshot, clearTimers, clearVisitorSlowTimer]);

  // Game started dialogue — fires once when dealing animation completes
  useEffect(() => {
    if (!snapshot || !ready || gameStartedRef.current) return;
    gameStartedRef.current = true;
    // Skip events that accumulated during the dealing animation
    processedRef.current = events.length;
    refillJokes();

    const now = Date.now();
    const visitorName = snapshot.players[0]?.name ?? 'Player';
    const ctx = { visitor: toDisplayName(visitorName) };
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

    scheduleDialogues(selected, REACTION_DELAY_BASE, timersRef, setDialogues, setHistory);
  }, [snapshot, ready]);

  // Visitor slow timer — when it's the visitor's turn, start a countdown
  useEffect(() => {
    clearVisitorSlowTimer();

    if (!snapshot || !ready) return;
    const visitorName = snapshot.players[0]?.name;
    if (!visitorName || snapshot.currentPlayerName !== visitorName) return;

    visitorSlowTimerRef.current = setTimeout(() => {
      if (jokeActiveRef.current) return;
      const now = Date.now();
      const ctx = { visitor: toDisplayName(visitorName) };
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
    if (!snapshot || !ready || events.length <= processedRef.current) return;

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

      // Decide if a joke will be told BEFORE scheduling regular dialogues
      const willTellJoke =
        event.type === 'turn_changed' &&
        !jokeActiveRef.current &&
        jokePoolRef.current.length > 0 &&
        Math.random() < JOKE_CHANCE;

      if (!jokeActiveRef.current && !willTellJoke) {
        scheduleDialogues(
          selected,
          REACTION_DELAY_BASE,
          timersRef,
          setDialogues,
          setHistory,
        );
      }

      if (willTellJoke) {
        jokeActiveRef.current = true;
        clearVisitorSlowTimer();
        const joke = jokePoolRef.current.pop()!;
        const teller = AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)];
        const reactors = otherAis(teller);
        const baseT =
          REACTION_DELAY_BASE + selected.length * STAGGER_INTERVAL + 400;
        const tellerIdx = AI_INDEX[teller];
        const intro =
          JOKE_INTROS[Math.floor(Math.random() * JOKE_INTROS.length)];

        const prompter =
          reactors[Math.floor(Math.random() * reactors.length)];
        const prompterIdx = AI_INDEX[prompter];
        const jokeTimers: ReturnType<typeof setTimeout>[] = [];

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

        // Phase 1b — "Go ahead" from another AI
        const goAheadLine =
          JOKE_GO_AHEAD_LINES[
            Math.floor(Math.random() * JOKE_GO_AHEAD_LINES.length)
          ];
        const goAheadShow = setTimeout(() => {
          setDialogues((prev) => {
            const n = [...prev];
            n[prompterIdx] = { message: goAheadLine, key: Date.now() };
            return n;
          });
          setHistory((prev) => [
            ...prev,
            {
              kind: 'dialogue',
              personality: prompter,
              message: goAheadLine,
              timestamp: Date.now(),
            },
          ]);
        }, baseT + JOKE_GO_AHEAD_DELAY);
        const goAheadHide = setTimeout(() => {
          setDialogues((prev) => {
            const n = [...prev];
            n[prompterIdx] = null;
            return n;
          });
        }, baseT + JOKE_GO_AHEAD_DELAY + JOKE_GO_AHEAD_DURATION);
        jokeTimers.push(goAheadShow, goAheadHide);

        // Phase 2 — Setup
        const setupStart = baseT + JOKE_PUNCHLINE_DELAY;
        const setupReadTime = jokeReadTime(joke.setup);

        const setupShow = setTimeout(() => {
          setDialogues((prev) => {
            const n = [...prev];
            n[tellerIdx] = { message: joke.setup, key: Date.now() };
            return n;
          });
          setHistory((prev) => [
            ...prev,
            {
              kind: 'dialogue',
              personality: teller,
              message: joke.setup,
              timestamp: Date.now(),
            },
          ]);
        }, setupStart);
        jokeTimers.push(setupShow);

        let reactionsStart: number;

        if (joke.punchline) {
          // Two-part: hide setup, optionally show question prompt, then punchline
          const setupHide = setTimeout(() => {
            setDialogues((prev) => {
              const n = [...prev];
              n[tellerIdx] = null;
              return n;
            });
          }, setupStart + setupReadTime);
          jokeTimers.push(setupHide);

          const punchlineText = joke.punchline;
          const questionWord = detectQuestionWord(joke.setup);
          let punchlineStart: number;

          if (questionWord) {
            // Phase 2b — Question prompt: "What?" / "Why?" etc.
            const responses = JOKE_QUESTION_RESPONSES[questionWord];
            const questionLine =
              responses[Math.floor(Math.random() * responses.length)];
            const questionStart =
              setupStart + setupReadTime + JOKE_QUESTION_PROMPT_DELAY;

            const questionShow = setTimeout(() => {
              setDialogues((prev) => {
                const n = [...prev];
                n[prompterIdx] = { message: questionLine, key: Date.now() };
                return n;
              });
              setHistory((prev) => [
                ...prev,
                {
                  kind: 'dialogue',
                  personality: prompter,
                  message: questionLine,
                  timestamp: Date.now(),
                },
              ]);
            }, questionStart);
            const questionHide = setTimeout(() => {
              setDialogues((prev) => {
                const n = [...prev];
                n[prompterIdx] = null;
                return n;
              });
            }, questionStart + JOKE_QUESTION_PROMPT_DURATION);
            jokeTimers.push(questionShow, questionHide);

            punchlineStart =
              questionStart +
              JOKE_QUESTION_PROMPT_DURATION +
              JOKE_SETUP_TO_PUNCHLINE_DELAY;
          } else {
            punchlineStart =
              setupStart + setupReadTime + JOKE_SETUP_TO_PUNCHLINE_DELAY;
          }

          const punchlineReadTime = jokeReadTime(punchlineText);
          reactionsStart = punchlineStart + punchlineReadTime;

          const punchlineShow = setTimeout(() => {
            setDialogues((prev) => {
              const n = [...prev];
              n[tellerIdx] = { message: punchlineText, key: Date.now() };
              return n;
            });
            setHistory((prev) => [
              ...prev,
              {
                kind: 'dialogue',
                personality: teller,
                message: punchlineText,
                timestamp: Date.now(),
              },
            ]);
          }, punchlineStart);
          const punchlineHide = setTimeout(() => {
            setDialogues((prev) => {
              const n = [...prev];
              n[tellerIdx] = null;
              return n;
            });
          }, reactionsStart);
          jokeTimers.push(punchlineShow, punchlineHide);
        } else {
          // Single joke: hide after read time
          reactionsStart = setupStart + setupReadTime;
          const setupHide = setTimeout(() => {
            setDialogues((prev) => {
              const n = [...prev];
              n[tellerIdx] = null;
              return n;
            });
          }, reactionsStart);
          jokeTimers.push(setupHide);
        }

        // Phase 3 — Reactions from other AIs
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

        // Deactivate joke guard after the last reaction hides
        const lastReactionEnd =
          reactionsStart +
          (reactors.length - 1) * JOKE_REACTION_STAGGER +
          JOKE_REACTION_DURATION;
        const jokeEnd = setTimeout(() => {
          jokeActiveRef.current = false;
        }, lastReactionEnd);

        timersRef.current.push(introShow, introHide, ...jokeTimers, jokeEnd);
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
