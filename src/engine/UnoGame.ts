import { Game, Card, Color, Value } from 'uno-engine';
import type {
  GameSnapshot,
  GamePhase,
  GameEvent,
  GameEventListener,
  GameEndInfo,
  PlayerScoreBreakdown,
  DialogueTrigger,
  PendingChallenge,
  ChallengeResult,
} from '@/types/game';
import {
  serializeCard,
  serializePlayer,
  serializeDirection,
  getCardId,
} from '@/engine/serializers';

type HouseRule = { setup: (...args: unknown[]) => void };

/**
 * Adapter around `uno-engine` Game class.
 *
 * Provides a serializable snapshot-based API suitable for React/Redux,
 * translates engine events into our domain events, and offers hooks
 * for extending rules without modifying the underlying engine.
 */
export class UnoGame {
  private engine: Game;
  private listeners: GameEventListener[] = [];
  private phase: GamePhase = 'playing';
  private winner: string | null = null;
  private score: number | null = null;
  private humanPlayerName: string;
  private houseRules: HouseRule[];
  private _hasDrawn = false;
  private discardHistory: Card[];
  /** Stable seat order: player names rotated so the human is at index 0. */
  private seatOrder: string[];
  /** Pending WD4 challenge state — set after a WD4 is played, cleared on resolution. */
  private _pendingChallenge: (PendingChallenge & { wasBluff: boolean }) | null = null;
  /** Player who just played to 1 card and needs to call UNO. Cleared on callUno() or next turn. */
  private _unoCallable: string | null = null;

  constructor(
    playerNames: string[],
    humanPlayerName: string,
    houseRules: HouseRule[] = [],
  ) {
    this.humanPlayerName = humanPlayerName;
    this.houseRules = houseRules;
    this.engine = new Game(playerNames, houseRules);
    this.discardHistory = [this.engine.discardedCard];

    // Compute stable seat order once — the engine may reorder its players
    // array on reverse cards, but we always want the same name→seat mapping.
    const names = this.engine.players.map((p) => p.name);
    const humanIdx = names.indexOf(humanPlayerName);
    this.seatOrder = humanIdx > 0
      ? [...names.slice(humanIdx), ...names.slice(0, humanIdx)]
      : names;

    this.bindEngineEvents();
  }

  // ---------------------------------------------------------------------------
  // Event system
  // ---------------------------------------------------------------------------

  /** Subscribe to game events. Returns an unsubscribe function. */
  onEvent(listener: GameEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(event: GameEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private bindEngineEvents(): void {
    this.engine.on(
      'cardplay',
      (event: { card: Card; player: { name: string } }) => {
        this.discardHistory.push(event.card);

        // Detect UNO condition: player just played down to 1 card
        const player = this.engine.getPlayer(event.player.name);
        if (player.hand.length === 1) {
          this._unoCallable = event.player.name;
        }

        const trigger = this.getDialogueTrigger(event.card);
        this.emit({
          type: 'card_played',
          playerName: event.player.name,
          card: serializeCard(event.card),
          data: { trigger },
        });
      },
    );

    this.engine.on(
      'draw',
      (event: { player: { name: string }; cards: Card[] }) => {
        this._hasDrawn = true;
        this.emit({
          type: 'card_drawn',
          playerName: event.player.name,
          data: { count: event.cards.length },
        });
      },
    );

    this.engine.on(
      'nextplayer',
      (event: { player: { name: string } }) => {
        this._hasDrawn = false;
        // NOTE: do NOT clear _unoCallable here — cardplay and nextplayer
        // fire synchronously within engine.play(), so clearing here would
        // erase it before React ever sees it. The controller manages the
        // UNO window lifecycle via callUno() and the catch timer.
        this.emit({
          type: 'turn_changed',
          playerName: event.player.name,
        });
      },
    );

    this.engine.on(
      'end',
      (event: { winner: { name: string }; score: number }) => {
        this.phase = 'ended';
        this.winner = event.winner.name;
        this.score = event.score;
        this.emit({
          type: 'game_ended',
          playerName: event.winner.name,
          data: { score: event.score },
        });
      },
    );
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /** Play a card from the current player's hand. */
  playCard(card: Card, chosenColor?: Color): void {
    if (card.value === Value.WILD_DRAW_FOUR) {
      // Snapshot bluffer's hand BEFORE play to detect bluff.
      // A play is a bluff if the player had non-wild cards matching the discard color.
      const discardColor = this.engine.discardedCard.color;
      const blufferName = this.engine.currentPlayer.name;
      const victimName = this.engine.nextPlayer.name;
      const wasBluff = this.engine.currentPlayer.hand.some(
        (c) => !c.isWildCard() && c.color === discardColor,
      );

      // Set challenge state BEFORE engine.play() so that events fired during
      // play() produce snapshots with pendingChallenge set, preventing AI
      // from being scheduled while the challenge window is open.
      this._pendingChallenge = { blufferName, victimName, wasBluff };
      this.phase = 'challenging';

      if (chosenColor) card.color = chosenColor;
      this.engine.play(card);
      return;
    }

    if (card.isWildCard() && chosenColor) {
      card.color = chosenColor;
    }
    this.engine.play(card);
  }

  /** Draw a card for the current player. */
  draw(): void {
    this.engine.draw();
  }

  /** Pass after drawing. */
  pass(): void {
    this.engine.pass();
  }

  /** Call UNO for a player. Returns names of players penalized. */
  callUno(yellingPlayerName?: string): string[] {
    // Catch: someone else is calling out the unoCallable player.
    // Apply the penalty directly — engine.uno() has a hand-size check
    // that misfires when the caller has ≤ 2 cards, treating it as a
    // self-call instead of a catch.
    if (yellingPlayerName && this._unoCallable && yellingPlayerName !== this._unoCallable) {
      const targetName = this._unoCallable;
      const target = this.engine.getPlayer(targetName);
      this.engine.draw(target, 2, { silent: true });
      this._unoCallable = null;

      this.emit({ type: 'uno_called', playerName: yellingPlayerName });
      this.emit({ type: 'uno_penalty', playerName: targetName, data: { count: 2 } });
      return [targetName];
    }

    // Self-call or fallback — delegate to engine
    const yellingPlayer = yellingPlayerName
      ? this.engine.getPlayer(yellingPlayerName)
      : undefined;
    const penalized = this.engine.uno(yellingPlayer);

    if (yellingPlayerName === this._unoCallable) {
      this._unoCallable = null;
    }

    if (yellingPlayerName) {
      this.emit({
        type: 'uno_called',
        playerName: yellingPlayerName,
      });
    }

    if (penalized.length > 0) {
      for (const p of penalized) {
        this.emit({
          type: 'uno_penalty',
          playerName: p.name,
          data: { count: 2 },
        });
      }
    }

    return penalized.map((p) => p.name);
  }

  /** Resolve a pending WD4 challenge. Returns the outcome, or null if accepted. */
  resolveChallenge(accepted: boolean): ChallengeResult | null {
    const challenge = this._pendingChallenge;
    if (!challenge) return null;

    this._pendingChallenge = null;
    this.phase = 'playing';

    if (accepted) {
      this.emit({
        type: 'challenge_resolved',
        playerName: challenge.victimName,
        data: { result: 'accepted', blufferName: challenge.blufferName },
      });
      return null;
    }

    if (challenge.wasBluff) {
      // Bluff caught — bluffer draws 4 penalty cards
      const bluffer = this.engine.getPlayer(challenge.blufferName);
      this.engine.draw(bluffer, 4, { silent: true });
      this.emit({
        type: 'card_drawn',
        playerName: challenge.blufferName,
        data: { count: 4 },
      });
      this.emit({
        type: 'challenge_resolved',
        playerName: challenge.victimName,
        data: { result: 'bluff_caught', blufferName: challenge.blufferName },
      });
      return 'bluff_caught';
    }

    // Legit play — challenger draws 2 extra penalty cards
    const victim = this.engine.getPlayer(challenge.victimName);
    this.engine.draw(victim, 2, { silent: true });
    this.emit({
      type: 'card_drawn',
      playerName: challenge.victimName,
      data: { count: 2 },
    });
    this.emit({
      type: 'challenge_resolved',
      playerName: challenge.victimName,
      data: { result: 'legit_play', blufferName: challenge.blufferName },
    });
    return 'legit_play';
  }

  /** Get the player who needs to call UNO, or null. */
  getUnoCallable(): string | null {
    return this._unoCallable;
  }

  /** Set or clear the UNO callable player (controller manages the lifecycle). */
  setUnoCallable(name: string | null): void {
    this._unoCallable = name;
  }

  /** Get the pending challenge state (without revealing wasBluff). */
  getPendingChallenge(): PendingChallenge | null {
    if (!this._pendingChallenge) return null;
    return {
      blufferName: this._pendingChallenge.blufferName,
      victimName: this._pendingChallenge.victimName,
    };
  }

  /** Restart the game with the same players and rules. */
  restart(): void {
    const playerNames = this.engine.players.map((p) => p.name);
    this.engine = new Game(playerNames, this.houseRules);
    this.discardHistory = [this.engine.discardedCard];
    this.phase = 'playing';
    this.winner = null;
    this.score = null;
    this._pendingChallenge = null;
    this._unoCallable = null;

    // Recompute stable seat order for the new engine instance
    const names = this.engine.players.map((p) => p.name);
    const humanIdx = names.indexOf(this.humanPlayerName);
    this.seatOrder = humanIdx > 0
      ? [...names.slice(humanIdx), ...names.slice(0, humanIdx)]
      : names;

    this.bindEngineEvents();
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /** Get a full serializable snapshot of the game state. */
  getSnapshot(): GameSnapshot {
    // Use the stable seat order computed at construction time so that
    // players never swap seats when the engine reorders on reverse cards.
    const players = this.seatOrder.map((name) =>
      serializePlayer(this.engine.getPlayer(name)),
    );

    // After a reshuffle the engine recycles discards back into the draw
    // pile.  Purge any cards that are no longer truly discarded so the
    // snapshot never reports a card in two zones at once.
    const liveIds = new Set<string>();
    for (const p of this.engine.players) {
      for (const c of p.hand) liveIds.add(getCardId(c));
    }
    for (const c of this.engine.deck.cards) liveIds.add(getCardId(c));
    this.discardHistory = this.discardHistory.filter(
      (c) => !liveIds.has(getCardId(c)),
    );

    return {
      phase: this.phase,
      currentPlayerName: this.engine.currentPlayer.name,
      players,
      discardPile: this.discardHistory.map(serializeCard),
      direction: serializeDirection(this.engine.playingDirection),
      drawPile: this.engine.deck.cards.map(serializeCard),
      winner: this.winner,
      score: this.score,
      playableCardIds: this.getPlayableCards().map((c) => getCardId(c)),
      pendingChallenge: this.getPendingChallenge(),
      unoCallable: this._unoCallable
        ? { playerName: this._unoCallable, deadline: 0 }
        : null,
    };
  }

  /** Get the current player's name. */
  getCurrentPlayerName(): string {
    return this.engine.currentPlayer.name;
  }

  /** Check if it's the human player's turn. */
  isHumanTurn(): boolean {
    return this.engine.currentPlayer.name === this.humanPlayerName;
  }

  /** Get cards the human player can legally play on the current discard. */
  getPlayableCards(): Card[] {
    return this.getPlayableCardsForPlayer(this.humanPlayerName);
  }

  /** Get cards a specific player can legally play on the current discard. */
  getPlayableCardsForPlayer(playerName: string): Card[] {
    const player = this.engine.getPlayer(playerName);
    const discard = this.engine.discardedCard;
    return player.hand.filter((card) => {
      if (card.isWildCard()) return true;
      return card.matches(discard);
    });
  }

  /** Find a Card instance in a player's hand by its serialized ID. */
  findCardInHand(playerName: string, cardId: string): Card | undefined {
    return this.getPlayerHand(playerName).find((c) => getCardId(c) === cardId);
  }

  /** Get a player's hand (Card instances from the engine). */
  getPlayerHand(playerName: string): Card[] {
    return this.engine.getPlayer(playerName).hand;
  }

  /** Check whether the current player has already drawn this turn. */
  hasDrawn(): boolean {
    return this._hasDrawn;
  }

  /** Get the underlying engine instance (escape hatch for custom rules). */
  getEngine(): Game {
    return this.engine;
  }

  /** Get end-of-game info with per-player score breakdown. Returns null if game hasn't ended. */
  getGameEndInfo(): GameEndInfo | null {
    if (this.phase !== 'ended' || !this.winner || this.score === null) return null;

    const breakdown: PlayerScoreBreakdown[] = this.seatOrder
      .filter((name) => name !== this.winner)
      .map((name) => {
        const hand = this.engine.getPlayer(name).hand;
        return {
          name,
          cardCount: hand.length,
          points: hand.reduce((sum, card) => sum + card.score, 0),
        };
      });

    return { winner: this.winner, score: this.score, breakdown };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** DEV ONLY — trim a player's hand to `keep` cards. Remove before production. */
  devTrimHand(playerName: string, keep: number): void {
    const player = this.engine.getPlayer(playerName);
    while (player.hand.length > keep) {
      player.hand.pop();
    }
  }

  /** DEV ONLY — force the game to end immediately for testing. Remove before production. */
  devForceEnd(winnerName?: string): void {
    const winner = winnerName ?? this.seatOrder[1];
    this.phase = 'ended';
    this.winner = winner;
    this.score = this.seatOrder
      .filter((n) => n !== winner)
      .reduce((sum, name) => {
        return sum + this.engine.getPlayer(name).hand.reduce((s, c) => s + c.score, 0);
      }, 0);
    this.emit({ type: 'game_ended', playerName: winner, data: { score: this.score } });
  }

  /** Map a card to the dialogue trigger type for the portfolio narrative. */
  getDialogueTrigger(card: Card): DialogueTrigger {
    switch (card.value) {
      case Value.DRAW_TWO:
        return 'draw_two';
      case Value.SKIP:
        return 'skip';
      case Value.REVERSE:
        return 'reverse';
      case Value.WILD:
        return 'wild';
      case Value.WILD_DRAW_FOUR:
        return 'wild_draw_four';
      default:
        return 'number';
    }
  }
}
