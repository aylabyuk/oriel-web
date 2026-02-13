import { Value, Color } from 'uno-engine';
import { AI_STRATEGIST, AI_TRASH_TALKER, AI_CHILL } from '@/constants/players';

export const AI_INDEX: Record<string, number> = {
  [AI_STRATEGIST]: 1,
  [AI_TRASH_TALKER]: 2,
  [AI_CHILL]: 3,
};

/** Delay after event before first dialogue appears (ms) */
export const REACTION_DELAY_BASE = 800;
/** Additional stagger for a second responder (ms) */
export const STAGGER_INTERVAL = 1200;
/** How long a dialogue bubble stays visible (ms) */
export const BUBBLE_DURATION = 3000;
/** Max AI that react to a single event */
export const MAX_REACTORS = 2;
/** How long before AIs comment on visitor being slow (ms) */
export const VISITOR_SLOW_THRESHOLD = 4500;
/** Probability that an AI shares personal info about Oriel on a turn change */
export const PERSONAL_INFO_CHANCE = 0.55;
/** Cooldown after a personal info thread before another can start (ms) */
export const PERSONAL_INFO_COOLDOWN = 8000;
/** Probability that an AI tells a joke on a turn change */
export const JOKE_CHANCE = 0.05;
/** Refetch threshold — fetch more jokes when pool drops below this */
export const JOKE_REFETCH_THRESHOLD = 3;

/** Joke sequence timing (ms) */
export const JOKE_INTRO_DURATION = 2500;
export const JOKE_GO_AHEAD_DELAY = 1200;
export const JOKE_GO_AHEAD_DURATION = 1500;
export const JOKE_PUNCHLINE_DELAY = 2800;
export const JOKE_SETUP_TO_PUNCHLINE_DELAY = 800;
export const JOKE_QUESTION_PROMPT_DELAY = 400;
export const JOKE_QUESTION_PROMPT_DURATION = 1500;
export const JOKE_REACTION_STAGGER = 1500;
export const JOKE_REACTION_DURATION = 4000;
/** Max words allowed for a joke (total across setup + punchline) — longer jokes are discarded */
export const MAX_JOKE_WORDS = 25;
/** ms per word for joke read time, with a floor */
export const JOKE_MS_PER_WORD = 400;
export const JOKE_READ_TIME_MIN = 5000;

/** Estimate how long a joke needs to stay on screen based on word count. */
export const jokeReadTime = (text: string): number =>
  Math.max(JOKE_READ_TIME_MIN, text.split(/\s+/).length * JOKE_MS_PER_WORD);

export const JOKE_INTROS = [
  'Hey, I got a joke!',
  'Okay okay, listen to this one...',
  'While we wait... wanna hear a joke?',
  "Here's one for you all.",
  'Joke time!',
  'You guys ready for this?',
  'Stop me if you heard this one...',
];

export const JOKE_GO_AHEAD_LINES = [
  'Go ahead.',
  "Let's hear it.",
  'Oh boy...',
  'Sure, why not.',
  'Hit us.',
  "Alright, let's hear it.",
  'This better be good.',
  'Go for it.',
];

const QUESTION_WORDS = ['what', 'why', 'how', 'who', 'when', 'where'] as const;

/** Detect a question word at the start of a joke setup, or null if none found */
export const detectQuestionWord = (text: string): string | null => {
  const first = text
    .trim()
    .split(/\s+/)[0]
    ?.toLowerCase()
    .replace(/[^a-z]/g, '');
  if (!first) return null;
  return QUESTION_WORDS.find((w) => first.startsWith(w)) ?? null;
};

export const JOKE_QUESTION_RESPONSES: Record<string, string[]> = {
  what: ['What?', 'What??', 'Hmm, what?'],
  why: ['Why?', 'Why??', 'Okay why?'],
  how: ['How?', 'How??', 'Hmm, how?'],
  who: ['Who?', 'Who??'],
  when: ['When?', 'When??'],
  where: ['Where?', 'Where??'],
};

export const JOKE_REACTIONS_POSITIVE = [
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

export const JOKE_REACTIONS_NEGATIVE = [
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

/** Personal info sequence timing (ms) */
export const PERSONAL_INFO_INTRO_DURATION = 3000;
export const PERSONAL_INFO_FACT_DELAY = 600;
/** Gap between consecutive topic thread entries (ms) */
export const PERSONAL_INFO_FOLLOWUP_DELAY = 400;

export const PERSONAL_INFO_INTROS: Record<string, string[]> = {
  [AI_STRATEGIST]: [
    "Since we're playing — might as well tell you about Oriel.",
    "You're here to learn about Oriel, right? Let me share something.",
    "While we wait — here's something about our frontend dev.",
    'Fun fact about the guy who built this game.',
    "Since {visitor} came here to know Oriel — here's a data point.",
    "Let me optimize your visit — here's something about Oriel.",
    'You should know this about Oriel.',
    "Here's a relevant piece of intel about our colleague.",
  ],
  [AI_TRASH_TALKER]: [
    'Hey {visitor}, wanna know something about Oriel?',
    'Okay but real talk — let me tell you about Oriel!',
    'YO, fun fact about the dude who made this game!',
    "While we play — let's talk about Oriel for a sec!",
    "Since you're here, lemme put you on about our boy Oriel.",
    'Hey {visitor}! You came here for Oriel right? Listen to THIS!',
    'Okay okay — Oriel fact incoming!',
    'You gotta hear this about Oriel!',
  ],
  [AI_CHILL]: [
    "Oh by the way {visitor} — you're here for Oriel right? Here's something.",
    "Since we're just vibing... wanna hear about Oriel?",
    "You came to learn about Oriel? Cool. Here's one.",
    'Random Oriel fact while we play.',
    'So about the guy who built this game...',
    "Oh right — you're here to get to know Oriel. Here you go.",
    "Here's something about Oriel. Since that's why you're here and all.",
    'Oriel fact. No big deal.',
  ],
};

export const COLOR_NAMES: Record<number, string> = {
  [Color.RED]: 'Red',
  [Color.BLUE]: 'Blue',
  [Color.GREEN]: 'Green',
  [Color.YELLOW]: 'Yellow',
};

export const VALUE_NAMES: Record<number, string> = {
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
