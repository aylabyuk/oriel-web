import { Value, Color } from 'uno-engine';

export const AI_INDEX: Record<string, number> = {
  Meio: 1,
  Dong: 2,
  Oscar: 3,
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
export const VISITOR_SLOW_THRESHOLD = 6000;
/** Probability that an AI tells a joke on a turn change */
export const JOKE_CHANCE = 0.12;
/** Refetch threshold — fetch more jokes when pool drops below this */
export const JOKE_REFETCH_THRESHOLD = 3;

/** Joke sequence timing (ms) */
export const JOKE_INTRO_DURATION = 2500;
export const JOKE_PUNCHLINE_DELAY = 2800;
export const JOKE_REACTION_STAGGER = 1500;
export const JOKE_REACTION_DURATION = 4000;
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
