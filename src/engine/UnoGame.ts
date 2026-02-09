import { Game, Card, Color, Value } from 'uno-engine';
import type {
  GameSnapshot,
  GamePhase,
  GameEvent,
  GameEventListener,
  DialogueTrigger,
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

  constructor(
    playerNames: string[],
    humanPlayerName: string,
    houseRules: HouseRule[] = [],
  ) {
    this.humanPlayerName = humanPlayerName;
    this.houseRules = houseRules;
    this.engine = new Game(playerNames, houseRules);
    this.discardHistory = [this.engine.discardedCard];
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
      ({ data }: { data: { card: Card; player: { name: string } } }) => {
        this.discardHistory.push(data.card);
        const trigger = this.getDialogueTrigger(data.card);
        this.emit({
          type: 'card_played',
          playerName: data.player.name,
          card: serializeCard(data.card),
          data: { trigger },
        });
      },
    );

    this.engine.on(
      'draw',
      ({ data }: { data: { player: { name: string }; cards: Card[] } }) => {
        this._hasDrawn = true;
        this.emit({
          type: 'card_drawn',
          playerName: data.player.name,
          data: { count: data.cards.length },
        });
      },
    );

    this.engine.on(
      'nextplayer',
      ({ data }: { data: { player: { name: string } } }) => {
        this._hasDrawn = false;
        this.emit({
          type: 'turn_changed',
          playerName: data.player.name,
        });
      },
    );

    this.engine.on(
      'end',
      ({ data }: { data: { winner: { name: string }; score: number } }) => {
        this.phase = 'ended';
        this.winner = data.winner.name;
        this.score = data.score;
        this.emit({
          type: 'game_ended',
          playerName: data.winner.name,
          data: { score: data.score },
        });
      },
    );
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /** Play a card from the current player's hand. */
  playCard(card: Card, chosenColor?: Color): void {
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
    const yellingPlayer = yellingPlayerName
      ? this.engine.getPlayer(yellingPlayerName)
      : undefined;
    const penalized = this.engine.uno(yellingPlayer);

    if (yellingPlayerName) {
      this.emit({
        type: 'uno_called',
        playerName: yellingPlayerName,
      });
    }

    return penalized.map((p) => p.name);
  }

  /** Restart the game with the same players and rules. */
  restart(): void {
    const playerNames = this.engine.players.map((p) => p.name);
    this.engine = new Game(playerNames, this.houseRules);
    this.discardHistory = [this.engine.discardedCard];
    this.phase = 'playing';
    this.winner = null;
    this.score = null;
    this.bindEngineEvents();
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /** Get a full serializable snapshot of the game state. */
  getSnapshot(): GameSnapshot {
    return {
      phase: this.phase,
      currentPlayerName: this.engine.currentPlayer.name,
      players: this.engine.players.map((p) => serializePlayer(p)),
      discardPile: this.discardHistory.map(serializeCard),
      direction: serializeDirection(this.engine.playingDirection),
      drawPile: this.engine.deck.cards.map(serializeCard),
      winner: this.winner,
      score: this.score,
      playableCardIds: this.getPlayableCards().map((c) => getCardId(c)),
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

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

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
