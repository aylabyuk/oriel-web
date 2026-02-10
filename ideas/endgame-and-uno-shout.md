# Endgame, UNO Shout & Edge Cases

Covers winning conditions, UNO callout mechanics, scoring, deck exhaustion, and other endgame edge cases.

## 1. UNO Shout

### Official Rules

A player must shout "UNO!" when they play their second-to-last card (going down to 1 card). If they forget and another player catches them before the next player takes their turn, the offender draws 2 penalty cards.

### Engine Support

`uno-engine` has a built-in `game.uno(yellingPlayer?)` method:

- Player with 1–2 cards yells → marked as "yelled", no penalty
- Another player yells while someone has exactly 1 card and hasn't yelled → that someone draws 2 penalty cards
- If no one has 1 card unmarked → the yeller draws 2 for a false call
- Yell state resets when a player draws

`UnoGame.callUno()` already wraps this and emits `uno_called` events.

### Design

**Visitor (human) shout:** Add a pulsing "UNO!" button that appears when the visitor plays down to 2 cards. The button stays visible until the next turn advances. If the visitor doesn't tap it in time, AI opponents can catch them.

**AI shout:** After an AI plays down to 1 card, schedule a delayed self-call (70–90% chance they remember). If they forget, the visitor gets a brief window to catch them via a "Catch!" button.

**AI catching the visitor:** If the visitor plays to 1 card and doesn't press the UNO button before the AI think timer fires, there's a 50% chance an AI catches them.

**Visual feedback:**
- Successful UNO shout → toast on the shouter with "UNO!" in the active card color
- Caught penalty → toast on the penalized player with "Caught! +2" in red
- False call → toast on the yeller with "False call! +2" in red

### Timing

```
Visitor plays to 1 card
├── UNO button appears (pulsing, prominent)
├── AI think timer starts (1.5–2.5s)
│   ├── Visitor taps UNO → safe, button disappears
│   └── Timer fires → 50% chance AI catches visitor → draw 2 penalty
└── Next turn advances → UNO window closes

AI plays to 1 card
├── 70–90% chance: AI self-calls UNO after 0.3–0.8s delay → toast "UNO!"
├── 10–30% chance: AI "forgets"
│   └── "Catch!" button appears for visitor (visible ~3s)
│       ├── Visitor taps → AI draws 2 penalty
│       └── Timer expires → AI got away with it
└── Next turn advances → window closes
```

### UI — UNO / Catch Button

A single `UnoButton` component handles both modes (shout and catch). Follows the existing modal pattern (`DrawChoiceModal`, `ChallengeModal`): `@react-spring/web` animated.div, fixed position, spring entrance/exit.

**Component:** `src/components/ui/UnoButton/UnoButton.tsx`

```
Props:
  mode: 'shout' | 'catch' | null   — null = hidden
  targetName?: string               — AI name when catching (e.g. "Catch Meio!")
  onPress: () => void               — fires callUno or catch
```

**Shout mode (visitor needs to call UNO):**
- Fixed bottom-center, large, impossible to miss
- Bright pulsing background (amber/yellow glow, matching UNO brand energy)
- Text: "UNO!" in bold
- Pulsing scale animation via `@react-spring/web` loop: `1.0 → 1.08 → 1.0`
- Shrinking radial progress ring around the button edge showing time remaining (~2.5s window)
- On press: spring scale bounce (1.0 → 1.3 → 0 exit), fires `callUno(visitorName)`

**Catch mode (AI forgot to call UNO):**
- Same position (bottom-center) so the visitor's eyes are already there
- Red/orange background — urgency, different from shout's amber
- Text: "Catch {name}!" (e.g. "Catch Meio!")
- Same pulsing animation but slightly faster (more urgency)
- Same radial progress ring (~3s window)
- On press: spring bounce exit, fires `callUno(visitorName)` which penalizes the AI via the engine
- On timeout: fades out, AI got away with it

**Spring config:**
```
Entrance: { tension: 300, friction: 18 }     — snappy pop-in
Pulse loop: { tension: 200, friction: 12 }   — gentle breathing
Exit: { tension: 260, friction: 20 }         — quick fade-out
```

**Layout:** Positioned `fixed bottom-6 left-1/2 -translate-x-1/2 z-50` so it sits above hand cards but below modals. Uses the same `bg-neutral-900/80 backdrop-blur-sm rounded-2xl` container style as the draw choice modal.

**Accessibility:** `aria-label="Call UNO"` / `aria-label="Catch {name}"`, keyboard focusable, visible focus ring.

### State

- `unoWindow: { playerName: string; deadline: number } | null` — tracks who needs to call and when the window closes
- UNO button visibility derived from `unoWindow.playerName === visitorName`
- Catch button visibility derived from `unoWindow.playerName !== visitorName`

## 2. Winning & Game End

### Current State

The engine fires an `end` event with `{ winner, score }` when a player's hand empties. `UnoGame` already handles this: sets `phase = 'ended'`, stores `winner` and `score`, emits `game_ended`.

### What's Missing

No UI acknowledges the win. The game just stops.

### Design

**End-of-game sequence:**

1. Last card plays → play animation completes
2. Brief pause (500ms) for dramatic effect
3. Winner announcement overlay:
   - If visitor won: celebratory screen — "You win!" + confetti/particle effect + score
   - If AI won: softer screen — "{AI name} wins!" + score + "Better luck next time"
4. Score breakdown panel (see Scoring below)
5. "Play Again" button → calls `game.restart()`, resets all animation state
6. Tie into portfolio narrative: end screen reveals remaining resume content not yet unlocked during gameplay

**Phase:** `phase === 'ended'` already exists in `GamePhase`. UI components check this.

## 3. Scoring

### Engine Scoring

`uno-engine` calculates score as the sum of card point values in ALL other players' hands:

| Card | Points |
|------|--------|
| Number 0–9 | Face value |
| Skip | 20 |
| Reverse | 20 |
| Draw Two | 20 |
| Wild | 50 |
| Wild Draw Four | 50 |

The winner's score = penalty burden of all losers combined.

### Design

**Score display on game end:**
- Show the winner's total score (already computed by engine)
- Show a breakdown per losing player: name + card count + point contribution
- Optional: animate counting up the score

**Multi-round scoring (future):** Standard UNO plays to 500 points across rounds. For the portfolio, single-round is fine — but the data model should not preclude multi-round later. Store `score` per game; a future `matchScore` could accumulate across rounds.

**Score in snapshot:** Already present as `snapshot.score`. No type changes needed for single-round.

## 4. Deck Exhaustion

### Engine Behavior

The deck **never truly runs out**. When `privateDraw()` needs more cards than the deck has:
1. Draws all remaining cards
2. Calls `deck.shuffle.reset()` + `deck.shuffle.shuffle()` — rebuilds from a fresh 108-card deck
3. Draws remaining needed cards from the fresh pile

**Important:** This means cards can exist in multiple zones after a reshuffle (a player holds a card AND it re-appears in the deck). `UnoGame.getSnapshot()` already handles this — it purges `discardHistory` entries that reappeared in hands or the deck via the `liveIds` set.

### Visual Concerns

After a reshuffle:
- The discard pile visually empties (cards recycled into deck)
- The draw pile visually refills
- `useMagnetState` should handle this naturally since it diffs snapshot arrays

**Optional polish:**
- Show a brief "Reshuffling..." toast or animation when the discard pile is recycled
- Detect reshuffle by comparing draw pile sizes between snapshots (sudden increase)

### No-Move Stalemate

In theory, if a reshuffle produces no playable cards for anyone, turns would cycle with each player drawing and passing. This is extremely rare with 108 cards and 4 players. No special handling needed — the game self-resolves as reshuffles produce new combinations.

## 5. Other Edge Cases

### Reverse with 2 Remaining Players

If a player is eliminated in a future multi-round variant, a 2-player reverse acts as a skip (engine already handles this internally). No special adapter logic needed.

### Stacking (House Rule — Not Implemented)

Some house rules allow stacking Draw 2 on Draw 2 or WD4 on WD4. The engine supports house rules via its constructor. Not planned for the portfolio, but the `houseRules` parameter in `UnoGame` already allows this if desired.

### Player Disconnection / Tab Close

Not applicable for single-player vs AI. If the tab closes, the game is lost — no persistence needed for the portfolio use case.

### Race Conditions in UNO Shout

The UNO shout window is time-based. Potential race:
- Visitor presses UNO at the exact moment the AI catch timer fires

Resolution: UNO button press immediately clears `unoWindow`. The AI catch handler checks `unoWindow` before penalizing — if null, the visitor was safe.

### AI Playing Last Card as Wild

If an AI's last card is a Wild or WD4, the AI still chooses a random color. The color doesn't matter for scoring but does affect the discard pile color shown on the end screen. No special handling needed.

## 6. Implementation Order

### Phase A — Game End (P0)

1. **`src/types/game.ts`** — Add `GameEndInfo` type (`winner`, `score`, per-player breakdown)
2. **`src/engine/UnoGame.ts`** — Add `getScoreBreakdown()` that returns each loser's name, card count, and point contribution. Expose in snapshot or as a separate query
3. **`src/hooks/useGameController.ts`** — Add `restartGame` callback that calls `game.restart()`, dispatches fresh snapshot, and resets animation state
4. **`src/components/ui/GameEndOverlay/GameEndOverlay.tsx`** + `index.ts` — NEW overlay with winner announcement, score breakdown, "Play Again" button. Spring entrance/exit matching existing modal pattern
5. **`src/App.tsx`** — Render `<GameEndOverlay>` when `snapshot.phase === 'ended'`, wire `onPlayAgain` to `restartGame`, enable the existing `<RestartButton>`
6. **Build + test**

### Phase B — UNO Shout: Visitor (P1)

7. **`src/types/game.ts`** — Add `UnoWindow` type (`{ playerName: string; deadline: number }`)
8. **`src/engine/UnoGame.ts`** — Track UNO window state: after any card play that leaves a player at 1 card, set `unoWindow`. Expose `getUnoWindow()`. Clear on `callUno()` or when next turn advances
9. **`src/hooks/useGameController.ts`** — Add `callUno` callback wrapping `game.callUno(visitorName)`. Dispatch updated snapshot. Detect visitor at 1 card → open UNO window. Schedule AI catch timer (1.5–2.5s, 50% chance)
10. **`src/components/ui/UnoButton/UnoButton.tsx`** + `index.ts` — NEW component with `mode: 'shout' | 'catch' | null`, pulsing animation, radial countdown ring
11. **`src/App.tsx`** — Derive UNO button mode from snapshot. Wire `onPress` to `callUno`. Manage shout window timeout
12. **Build + test**

### Phase C — UNO Shout: AI + Catch (P1)

13. **`src/hooks/useGameController.ts`** — After AI plays to 1 card, schedule self-call (70–90% chance after 0.3–0.8s). If AI "forgets", emit event to open catch window for visitor
14. **`src/App.tsx`** — When AI forgets, switch UNO button to `mode: 'catch'` with target name. Start catch window timer (~3s). On press → `callUno(visitorName)` penalizes AI. On timeout → clear window, AI escaped
15. **Toast integration** — "UNO!" toast on successful shout (active card color), "Caught! +2" toast on penalty (red), "False call! +2" on bad catch (red)
16. **Build + test**

### Phase D — Polish (P2)

17. **Reshuffle feedback** — Detect draw pile size jump in `useMagnetState`, show brief "Reshuffling..." toast
18. **Score animation** — Animate score counting up in `GameEndOverlay`
19. **Build + test full flow end-to-end**
