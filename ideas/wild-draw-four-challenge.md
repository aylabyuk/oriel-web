# Wild Draw Four Challenge

When a Wild Draw Four (WD4) is played, the victim can challenge the play — claiming the player had a matching-color card and was bluffing. Adds a strategic bluffing element to the game.

## Rules (Simplified)

Standard UNO rules say a WD4 may only be played when the player has no cards matching the discard pile's color. The next player can challenge this claim.

| Outcome | Effect |
|---------|--------|
| Accept (no challenge) | Victim keeps their 4 drawn cards. Game continues. |
| Challenge — bluff caught | Bluffer had matching-color cards. Bluffer draws 4 penalty cards. |
| Challenge — legit play | Bluffer had no matching-color cards. Challenger draws 2 extra penalty cards. |

**Simplification vs official rules:** The victim always keeps their 4 drawn cards regardless of challenge outcome. Penalties are additive. This avoids card-return logic.

## Bluff Detection

Before `engine.play()` for a WD4, snapshot the bluffer's hand. A play is a bluff if the player had any **non-wild** cards matching the current discard pile's **color**. Wild cards (including other WD4s) don't count as "matching" for this check.

```
discardColor = engine.discardedCard.color
wasBluff = hand.some(c => !c.isWildCard() && c.color === discardColor)
```

## Data Flow

```
1. Player plays WD4
   └── UnoGame.playCard()
       ├── Snapshots bluffer's hand → checks for bluff
       ├── engine.play(card) → auto-draws 4 for victim, advances turn
       └── Sets pendingChallenge = { blufferName, victimName, wasBluff }

2. Events fire → snapshots dispatched → animations queue
   ├── Play animation (card → discard pile)
   └── Draw-4 animation (4 cards → victim's hand)

3. After draw-4 animation completes
   └── onChallengeReady fires (BackgroundScene detects draw phase + pendingChallenge)

4. Challenge window
   ├── Human victim → ChallengeModal appears
   └── AI victim → auto-decides after think delay (30% challenge rate)

5. Resolution
   ├── UnoGame.resolveChallenge(accepted)
   │   ├── accepted → clear challenge, continue
   │   ├── bluff caught → engine.draw(bluffer, 4, { silent: true })
   │   └── legit play → engine.draw(victim, 2, { silent: true })
   └── Penalty draws → snapshot diff → draw animations play automatically
```

## Engine Internals

The `uno-engine` library has no native challenge API. Inside `engine.play()` for WD4:

1. `privateDraw(nextPlayer, 4)` — silent internal draw, NO events
2. `goToNextPlayer(true)` — skip victim silently
3. `goToNextPlayer()` — advance to next-next player, fires `nextplayer`

Only `cardplay` and `nextplayer` events fire. The victim's hand growth is detected via snapshot diffs in `useMagnetState`.

For penalty draws, we use `engine.draw(player, qty, { silent: true })` — executes the draw without firing engine events. We emit our own `card_drawn` domain event so the snapshot pipeline picks up the change.

## AI Challenge Strategy

AI opponents challenge with a flat 30% probability. This provides enough variety without being too aggressive. Could be enhanced later with smarter heuristics (hand size, cards remaining, etc.).

## Timing

The `onAnimationIdle` callback fires twice for a WD4 play:

1. After play animation (`prev` starts with `play_`) — "Draw 4!" toast
2. After draw-4 animation (`prev` starts with `draw_`) — challenge window

A dedicated `onChallengeReady` callback fires on the second transition when `snapshot.pendingChallenge` is set. This ensures the challenge modal appears only after all forced-draw animations complete.

## Architecture

- **UnoGame.ts** — Bluff detection, challenge state, resolution with penalty draws
- **useGameController.ts** — AI pause during challenge, AI auto-resolve, expose resolveChallenge
- **ChallengeModal** — UI component matching DrawChoiceModal pattern
- **BackgroundScene** — onChallengeReady callback (draw phase + pending challenge detection)
- **App.tsx** — Modal orchestration, challenge flow coordination
