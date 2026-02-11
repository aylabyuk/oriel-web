# AI Dialogue System

## Concept

The 3 AI opponents have distinct personalities and react to game events with short dialogue lines, creating the feel of playing with real people who chat, trash-talk, and comment on each other's plays.

## Personalities

- **Meio** — The Strategist: analytical, slightly smug, treats plays like chess moves, frustrated when outplayed, genuine compliments on clever plays
- **Mark** — The Trash Talker: loud, competitive, loves chaos, celebrates wins, dramatic in defeat, teases when hitting someone
- **Paul** — The Chill One: laid back, unbothered, underreacts to everything, accidentally savage, surprisingly gracious

## Architecture

### Data Layer (`src/data/dialogueLines.ts`)
Static dialogue lines organized by personality and category. Lines use template tokens (`{player}`, `{visitor}`, `{speaker}`) resolved at runtime. ~5-8 lines per category per personality.

### Selection Engine (`src/utils/dialogueSelector.ts`)
- Per-category probability gates (high-impact events like +4 trigger more often than plain wilds)
- 4-second cooldown per AI to prevent spam
- Last-5-lines dedup to avoid repetition
- Weighted random selection

### Orchestrator Hook (`src/hooks/useDialogue.ts`)
Watches Redux game events, maps them to dialogue categories, selects responding AIs (max 2 per event), staggers their responses (800ms + 1200ms), and manages bubble lifecycle (3s display).

### Visual (`PlayerLabel` speech bubble)
Dark semi-transparent bubble with left border colored by AI's avatar color, positioned above/below the player label separately from game effect toasts.

## Dialogue Categories

| Category | Trigger |
|---|---|
| `got_skipped` | AI was skipped |
| `got_draw_two` / `got_draw_four` | AI received +2 or +4 |
| `skipped_someone` / `hit_someone_draw` | AI dealt a skip or draw to someone |
| `played_reverse` / `played_wild` | AI played a reverse or wild |
| `opponent_got_skipped` / `opponent_drew_cards` | Bystander commenting |
| `uno_called_self` / `uno_called_opponent` | UNO announcements |
| `uno_caught` | Someone caught forgetting UNO |
| `challenge_bluff_caught` / `challenge_legit` | WD4 challenge outcomes |
| `game_won` / `game_lost` / `visitor_won` | Game end reactions |
| `low_cards` / `many_cards` | Hand size commentary |
