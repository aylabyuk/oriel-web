import { useRef, useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectEvents, selectSnapshot } from '@/store/slices/game';
import { createDialogueSelector } from '@/utils/dialogueSelector';
import type {
  AiPersonality,
  DialogueBubble,
  DialogueCategory,
  DialogueHistoryEntry,
} from '@/types/dialogue';
import { playChat } from '@/utils/sounds';
import { fetchJokes } from '@/utils/fetchJokes';
import type { Joke } from '@/utils/fetchJokes';
import { AI_NAMES, toDisplayName } from '@/constants/players';
import { PERSONAL_INFO_TOPICS } from '@/data/personalInfoTopics';
import {
  AI_INDEX,
  REACTION_DELAY_BASE,
  STAGGER_INTERVAL,
  MAX_REACTORS,
  VISITOR_SLOW_THRESHOLD,
  PERSONAL_INFO_CHANCE,
  PERSONAL_INFO_COOLDOWN,
  PERSONAL_INFO_INTRO_DURATION,
  PERSONAL_INFO_FACT_DELAY,
  PERSONAL_INFO_FOLLOWUP_DELAY,
  PERSONAL_INFO_INTROS,
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
} from './useDialogue.constants';
import {
  formatEventAction,
  mapEventToCandidates,
  otherAis,
  shuffle,
} from './eventHelpers';
import { scheduleDialogues } from './scheduleDialogues';

export const useDialogue = (ready: boolean) => {
  const events = useAppSelector(selectEvents);
  const snapshot = useAppSelector(selectSnapshot);
  const processedRef = useRef(0);
  const selectorRef = useRef(createDialogueSelector());
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const threadCountRef = useRef(0);
  const nextThreadId = () => `t-${++threadCountRef.current}`;
  const [dialogues, setDialogues] = useState<(DialogueBubble | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [history, setHistoryRaw] = useState<DialogueHistoryEntry[]>([]);
  const MAX_HISTORY = 200;
  const setHistory: typeof setHistoryRaw = (update) =>
    setHistoryRaw((prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    });
  const gameStartedRef = useRef(false);
  const gameCountRef = useRef(0);
  const visitorSlowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const jokePoolRef = useRef<Joke[]>([]);
  const jokeActiveRef = useRef(false);
  const personalInfoActiveRef = useRef(false);
  const personalInfoCooldownUntilRef = useRef(0);
  const usedTopicIndicesRef = useRef(new Set<number>());
  const fetchingJokesRef = useRef(false);

  const refillJokes = useCallback(() => {
    if (fetchingJokesRef.current) return;
    fetchingJokesRef.current = true;
    fetchJokes().then((jokes) => {
      const short = jokes.filter((j) => {
        const words =
          j.setup.split(/\s+/).length + (j.punchline?.split(/\s+/).length ?? 0);
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

  /** Schedule a personal info topic thread. Returns true if a topic was scheduled. */
  const schedulePersonalInfoThread = useCallback(
    (visitorName: string): boolean => {
      const selector = selectorRef.current;
      let available = PERSONAL_INFO_TOPICS.map((_, i) => i).filter(
        (i) =>
          !usedTopicIndicesRef.current.has(i) &&
          !selector.isTopicShown(PERSONAL_INFO_TOPICS[i].topicKey),
      );
      if (available.length === 0) {
        usedTopicIndicesRef.current.clear();
        available = PERSONAL_INFO_TOPICS.map((_, i) => i).filter(
          (i) => !selector.isTopicShown(PERSONAL_INFO_TOPICS[i].topicKey),
        );
      }
      if (available.length === 0) return false;

      personalInfoActiveRef.current = true;
      clearVisitorSlowTimer();
      const infoThreadId = nextThreadId();

      const topicIndex =
        available[Math.floor(Math.random() * available.length)];
      usedTopicIndicesRef.current.add(topicIndex);
      const topic = PERSONAL_INFO_TOPICS[topicIndex];
      selector.markTopicShown(topic.topicKey);

      const displayVisitor = toDisplayName(visitorName);
      const teller = topic.entries[0].personality;
      const tellerIdx = AI_INDEX[teller];
      const baseT = REACTION_DELAY_BASE;
      const infoTimers: ReturnType<typeof setTimeout>[] = [];

      const showIntro = Math.random() < 0.2;
      let cursor: number;

      if (showIntro) {
        const introPool = PERSONAL_INFO_INTROS[teller];
        let introLine =
          introPool[Math.floor(Math.random() * introPool.length)];
        introLine = introLine.split('{visitor}').join(displayVisitor);

        const introShow = setTimeout(() => {
          playChat(teller);
          setDialogues((prev) => {
            const n = [...prev];
            n[tellerIdx] = { message: introLine, key: Date.now() };
            return n;
          });
          setHistory((prev) => [
            ...prev,
            {
              kind: 'dialogue',
              personality: teller,
              message: introLine,
              timestamp: Date.now(),
              threadId: infoThreadId,
            },
          ]);
        }, baseT);
        const introHideT = baseT + PERSONAL_INFO_INTRO_DURATION;
        const introHide = setTimeout(() => {
          setDialogues((prev) => {
            const n = [...prev];
            n[tellerIdx] = null;
            return n;
          });
        }, introHideT);
        infoTimers.push(introShow, introHide);
        cursor = introHideT + PERSONAL_INFO_FACT_DELAY;
      } else {
        cursor = baseT;
      }

      for (const entry of topic.entries) {
        const entryIdx = AI_INDEX[entry.personality];
        const readTime = jokeReadTime(entry.text);

        const entryShow = setTimeout(() => {
          playChat(entry.personality);
          setDialogues((prev) => {
            const n = [...prev];
            n[entryIdx] = { message: entry.text, key: Date.now() };
            return n;
          });
          setHistory((prev) => [
            ...prev,
            {
              kind: 'dialogue',
              personality: entry.personality,
              message: entry.text,
              timestamp: Date.now(),
              topicKey: topic.topicKey,
              threadId: infoThreadId,
            },
          ]);
        }, cursor);
        const entryHide = setTimeout(() => {
          setDialogues((prev) => {
            const n = [...prev];
            n[entryIdx] = null;
            return n;
          });
        }, cursor + readTime);
        infoTimers.push(entryShow, entryHide);

        cursor += readTime + PERSONAL_INFO_FOLLOWUP_DELAY;
      }

      const infoEnd = setTimeout(() => {
        personalInfoActiveRef.current = false;
        personalInfoCooldownUntilRef.current =
          Date.now() + PERSONAL_INFO_COOLDOWN;
      }, cursor - PERSONAL_INFO_FOLLOWUP_DELAY);
      infoTimers.push(infoEnd);

      timersRef.current.push(...infoTimers);
      return true;
    },
    [clearVisitorSlowTimer],
  );

  /** On-demand personal info request — bypasses probability and cooldown */
  const requestPersonalInfo = useCallback(() => {
    if (personalInfoActiveRef.current || jokeActiveRef.current) return;
    const visitorName = snapshot?.players[0]?.name ?? 'Player';
    schedulePersonalInfoThread(visitorName);
  }, [snapshot, schedulePersonalInfoThread]);

  // Reset on game restart (snapshot goes null)
  useEffect(() => {
    if (snapshot !== null) return;
    clearTimers();
    clearVisitorSlowTimer();
    selectorRef.current.reset();
    processedRef.current = 0;
    gameStartedRef.current = false;
    jokeActiveRef.current = false;
    personalInfoActiveRef.current = false;
    usedTopicIndicesRef.current.clear();
    threadCountRef.current = 0;
    setDialogues([null, null, null, null]);
  }, [snapshot, clearTimers, clearVisitorSlowTimer]);

  // Game started dialogue — fires once when dealing animation completes
  useEffect(() => {
    if (!snapshot || !ready || gameStartedRef.current) return;
    gameStartedRef.current = true;
    gameCountRef.current += 1;
    // Skip events that accumulated during the dealing animation
    processedRef.current = events.length;
    refillJokes();
    // Prevent personal info from firing too early — give guests time to settle in
    personalInfoCooldownUntilRef.current =
      Date.now() + PERSONAL_INFO_COOLDOWN * 2;

    if (gameCountRef.current > 1) {
      setHistory((prev) => [
        ...prev,
        {
          kind: 'action',
          playerName: '',
          message: 'New game started',
          timestamp: Date.now(),
        },
      ]);
    }

    const now = Date.now();
    const visitorName = snapshot.players[0]?.name ?? 'Player';
    const ctx = { visitor: toDisplayName(visitorName) };

    // First game: force one random AI to introduce the website
    let introDelay = 0;
    if (gameCountRef.current === 1) {
      const introAi = shuffle([...AI_NAMES])[0];
      const introText = selectorRef.current.selectLine(
        introAi,
        'introduction' as DialogueCategory,
        ctx,
        now,
      );
      if (introText) {
        scheduleDialogues(
          [{ personality: introAi, text: introText }],
          REACTION_DELAY_BASE,
          timersRef,
          setDialogues,
          setHistory,
        );
        introDelay = STAGGER_INTERVAL;
      }
    }

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

    const tid = selected.length > 1 ? nextThreadId() : undefined;
    scheduleDialogues(
      selected,
      REACTION_DELAY_BASE + introDelay,
      timersRef,
      setDialogues,
      setHistory,
      tid,
    );
  }, [snapshot, ready]);

  // Visitor slow timer — when it's the visitor's turn, start a countdown
  useEffect(() => {
    clearVisitorSlowTimer();

    if (!snapshot || !ready) return;
    const visitorName = snapshot.players[0]?.name;
    if (!visitorName || snapshot.currentPlayerName !== visitorName) return;

    visitorSlowTimerRef.current = setTimeout(() => {
      if (jokeActiveRef.current || personalInfoActiveRef.current) return;
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
      // UNO shout — red banner only for self-calls (caller has 1 card)
      if (event.type === 'uno_called') {
        const caller = snapshot.players.find(
          (p) => p.name === event.playerName,
        );
        if (caller && caller.hand.length === 1) {
          setHistory((prev) => [
            ...prev,
            {
              kind: 'shout',
              playerName: toDisplayName(event.playerName),
              message: 'UNO!',
              timestamp: Date.now(),
            },
          ]);
        }
      }

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

      // Prioritize self-referencing categories (e.g. UNO shout) before shuffle
      const priority: string[] = ['uno_called_self'];
      const prioritized = candidates.filter((c) =>
        priority.includes(c.category),
      );
      const rest = candidates.filter((c) => !priority.includes(c.category));
      shuffle(rest);
      const ordered = [...prioritized, ...rest];

      let reactorCount = 0;
      const selected: { personality: AiPersonality; text: string }[] = [];

      for (const c of ordered) {
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

      // Decide if personal info will be shared (higher priority than jokes)
      const willShareInfo =
        event.type === 'turn_changed' &&
        !jokeActiveRef.current &&
        !personalInfoActiveRef.current &&
        Date.now() >= personalInfoCooldownUntilRef.current &&
        Math.random() < PERSONAL_INFO_CHANCE;

      // Decide if a joke will be told BEFORE scheduling regular dialogues
      const willTellJoke =
        event.type === 'turn_changed' &&
        !willShareInfo &&
        !jokeActiveRef.current &&
        !personalInfoActiveRef.current &&
        jokePoolRef.current.length > 0 &&
        Math.random() < JOKE_CHANCE;

      if (
        event.type === 'uno_called' ||
        (!jokeActiveRef.current &&
          !personalInfoActiveRef.current &&
          !willTellJoke &&
          !willShareInfo)
      ) {
        const tid = selected.length > 1 ? nextThreadId() : undefined;
        scheduleDialogues(
          selected,
          REACTION_DELAY_BASE,
          timersRef,
          setDialogues,
          setHistory,
          tid,
        );
      }

      if (willTellJoke) {
        jokeActiveRef.current = true;
        clearVisitorSlowTimer();
        const jokeThreadId = nextThreadId();
        const joke = jokePoolRef.current.pop()!;
        const teller = AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)];
        const reactors = otherAis(teller);
        const baseT =
          REACTION_DELAY_BASE + selected.length * STAGGER_INTERVAL + 400;
        const tellerIdx = AI_INDEX[teller];
        const intro =
          JOKE_INTROS[Math.floor(Math.random() * JOKE_INTROS.length)];

        const prompter = reactors[Math.floor(Math.random() * reactors.length)];
        const prompterIdx = AI_INDEX[prompter];
        const jokeTimers: ReturnType<typeof setTimeout>[] = [];

        // Phase 1 — Intro: "Hey, I got a joke!"
        const introShow = setTimeout(() => {
          playChat(teller);
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
              threadId: jokeThreadId,
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
          playChat(prompter);
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
              threadId: jokeThreadId,
            },
          ]);
        }, baseT + JOKE_GO_AHEAD_DELAY);
        const goAheadHide = setTimeout(
          () => {
            setDialogues((prev) => {
              const n = [...prev];
              n[prompterIdx] = null;
              return n;
            });
          },
          baseT + JOKE_GO_AHEAD_DELAY + JOKE_GO_AHEAD_DURATION,
        );
        jokeTimers.push(goAheadShow, goAheadHide);

        // Phase 2 — Setup
        const setupStart = baseT + JOKE_PUNCHLINE_DELAY;
        const setupReadTime = jokeReadTime(joke.setup);

        const setupShow = setTimeout(() => {
          playChat(teller);
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
              threadId: jokeThreadId,
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
              playChat(prompter);
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
                  threadId: jokeThreadId,
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
            playChat(teller);
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
                threadId: jokeThreadId,
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
            playChat(reactor);
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
                threadId: jokeThreadId,
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

      if (willShareInfo) {
        const scheduled = schedulePersonalInfoThread(visitorName);
        if (!scheduled) {
          // All topics exhausted — fall back to regular banter/jokes
          const tid = selected.length > 1 ? nextThreadId() : undefined;
          scheduleDialogues(
            selected,
            REACTION_DELAY_BASE,
            timersRef,
            setDialogues,
            setHistory,
            tid,
          );
        }
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

  return { dialogues, history, requestPersonalInfo };
};
