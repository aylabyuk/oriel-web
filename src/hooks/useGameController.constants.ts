import { Color } from 'uno-engine';

/** Delay for the card-play animation to finish before next AI move */
export const AI_ANIMATION_WAIT = 1800;
/** Random additional "thinking" delay range (ms) */
export const AI_THINK_MIN = 1000;
export const AI_THINK_MAX = 3000;

/** Delay range before AI tries to catch visitor forgetting UNO (ms) */
export const AI_CATCH_MIN = 1500;
export const AI_CATCH_MAX = 2500;
/** Probability that an AI opponent catches a visitor who forgot to call UNO */
export const AI_CATCH_CHANCE = 0.5;

/** Delay range for AI "thinking" before calling UNO on itself (ms) */
export const AI_UNO_THINK_MIN = 300;
export const AI_UNO_THINK_MAX = 800;
/** Probability that AI remembers to call UNO (forgets = 1 - this) */
export const AI_UNO_SELF_CALL_CHANCE = 0.5;
/** How long the catch window stays open after an AI forgets (ms) */
export const CATCH_WINDOW_DURATION = 3000;

/** Visitor turn timeout — matches TURN_DURATION_S in PlayerLabel (ms) */
export const VISITOR_TURN_TIMEOUT = 10_000;

export const ALL_COLORS = [
  Color.RED,
  Color.BLUE,
  Color.GREEN,
  Color.YELLOW,
];
