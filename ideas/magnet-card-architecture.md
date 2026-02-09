# Magnet Card Architecture

Decoupled positioning system for UNO card animations. Separates **where cards should be** (Magnet Cards) from **what cards look like and how they get there** (Visible Cards).

## Problem

Manually wiring react-spring animations to card positions is fragile — positions, rotations, and animation timing get tangled together, making the system hard to debug and extend.

## Core Idea

Two layers of cards exist in the scene:

1. **Magnet Cards** — invisible position targets that instantly snap to where a card should be
2. **Visible Cards** — textured 3D cards that animate toward their Magnet Card counterpart via react-spring

Each Magnet Card has a 1:1 relationship with a Visible Card (same card ID from the game engine). The Magnet Card says "be here, face this way." The Visible Card smoothly follows.

## Magnet Cards

- One per card in the game (matched by `cardId` from `uno-engine`)
- No textures — debug appearance: white front, gray back, small text showing metadata (color, value, cardId)
- Visible during development (toggled via debug flag), hidden in production
- Position and rotation update **instantly** (no animation) when game state changes
- Carry metadata: `cardId`, `zone`, `faceUp`, `position`, `rotation`

## Card Zones

Each card belongs to exactly one zone at any given time:

| Zone | Position | Facing | Layout |
|------|----------|--------|--------|
| `DECK` | Center-left of table | Face down | Stacked vertically with slight random rotation |
| `DISCARD_PILE` | Center-right of table | Face up | Stacked with small random XZ offset |
| `PLAYER_FRONT` | In front of each player's seat | Face down | Stacked on top of each other |
| `PLAYER_HAND` | Closer to player, slightly raised | Face up (all players during debug) | Spread horizontally, overlapping, enough to see color and value |

### Zone Orientation Details

- **DECK**: Cards lie flat on table, back facing up. Stacked along Y-axis.
- **DISCARD_PILE**: Cards lie flat on table, front facing up. Each card has slight random Z-rotation and XZ scatter for a natural pile look.
- **PLAYER_FRONT**: Cards lie flat, back facing up. Stacked on top of each other (like a mini deck) in front of the player's seat. Rotation matches the player's seat angle (facing table center).
- **PLAYER_HAND**: Cards lie flat (or slightly tilted toward the player). Front facing up. Spread horizontally with partial overlap — just enough offset to see each card's color and value. No arc/fan rotation.

## Movement Phases

Cards transition between zones in response to game events:

### 1. DEALING
```
DECK -> PLAYER_FRONT (for each player, one card at a time, round-robin)
```
- Initial game setup. Cards leave the deck and land face-down in front of each player.
- Magnet cards reposition instantly. Visible cards will later animate this as a dealing sequence.

### 2. REVEAL
```
PLAYER_FRONT -> PLAYER_HAND
```
- After dealing completes, each player's face-down cards flip and fan into their hand.
- Cards change from `faceUp: false` to `faceUp: true`.
- Order: all of one player's cards reveal together, then the next player.

### 3. INITIAL_DISCARD
```
DECK -> DISCARD_PILE
```
- The first card flipped from the deck to start the discard pile.
- Happens after dealing + reveal.
- Single card, changes to `faceUp: true`.

### 4. PLAY
```
PLAYER_HAND -> DISCARD_PILE (float above, then drop)
```
- A player (human or AI) plays a card from their hand.
- Card first floats up to a raised position above the discard pile (showing what was played), then drops down onto the pile.
- Two-step magnet: first move to a `DISCARD_FLOAT` position (same XZ as discard pile, elevated Y), then after a brief pause, settle to final `DISCARD_PILE` position.
- Remaining hand cards re-spread to fill the gap.

### 5. DRAW
```
DECK -> PLAYER_FRONT -> PLAYER_HAND (on top) -> PLAYER_HAND (sorted into last position)
```
- A player draws a card. It first appears face-down in front of them (PLAYER_FRONT), then flips into their hand.
- Three-step transition:
  1. DECK to PLAYER_FRONT (face down, stacked with their front pile)
  2. PLAYER_FRONT to PLAYER_HAND — card lands **on top of the hand** (elevated, centered over the spread, face up) so the drawn card is clearly visible
  3. After a brief pause, card slides into the **last position** of the hand spread
- Later, hand cards will be sorted by color group, number, and type — but for now, drawn cards always go to the end.

## Visible Cards

- One per Magnet Card (same `cardId`)
- Full front/back textures from existing `Card3D` component
- Use `react-spring` (`useSpring`) to animate `position` and `rotation` toward their Magnet Card's current values
- Flip animation: interpolate rotation to show front/back transition when `faceUp` changes
- Spring config can vary by phase (snappy for dealing, smooth for hand re-spread, etc.)

## Data Flow

```
Game Engine (uno-engine)
    |
    v
Redux (game slice - snapshot with card positions per zone)
    |
    v
Magnet Cards (read zone + compute 3D position/rotation instantly)
    |
    v
Visible Cards (read Magnet Card position, animate toward it with react-spring)
```

## Debug Mode

During development:
- Magnet Cards are **visible** (white/gray boxes with metadata text)
- Visible Cards render alongside (can be toggled off to see only magnets)
- Debug overlay shows zone assignments and phase transitions
- Toggle via a `DEBUG_MAGNETS` constant or Redux flag

## Implementation Order

1. Define zone layout functions (pure math: given zone + index + seat -> position & rotation)
2. Build `MagnetCard` component (debug visual + position props)
3. Build zone containers: `MagnetDeck`, `MagnetDiscardPile`, `MagnetPlayerFront`, `MagnetPlayerHand`
4. Wire to game snapshot — cards appear in correct zones based on engine state
5. Implement phase sequencing (dealing animation queue, reveal timing, etc.)
6. Build `VisibleCard` wrapper around `Card3D` with react-spring following its magnet
7. Polish spring configs per phase
8. Hide magnets, ship
