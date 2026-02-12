import { findAffectedPlayer } from '@/utils/dialogueSelector';
import type { AiPersonality, DialogueCategory } from '@/types/dialogue';
import type { GameEvent, GameSnapshot, SerializedCard } from '@/types/game';
import { AI_NAMES, AI_NAME_SET, toDisplayName } from '@/constants/players';
import { COLOR_NAMES, VALUE_NAMES } from './useDialogue.constants';

export type Candidate = {
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
export const formatEventAction = (
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
      return null; // handled as 'shout' entry below
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

export const isAi = (name: string): name is AiPersonality =>
  AI_NAME_SET.has(name);
export const otherAis = (exclude: string): AiPersonality[] =>
  AI_NAMES.filter((n) => n !== exclude);

/** Shuffle array in place (Fisher-Yates) and return it */
export const shuffle = <T>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const mapEventToCandidates = (
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

      // Idle chatter — pick one random AI to maybe comment on quiet turns
      const idleAi = AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)];
      candidates.push({
        personality: idleAi,
        category: 'idle',
        context: ctx,
      });
      break;
    }
  }

  return candidates;
};
