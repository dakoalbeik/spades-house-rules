/**
 * Shared types for the game state sent over the socket (server → client).
 * Keeps client and server in sync on the wire format.
 */

import { Brand } from "./general";

export type PlayerId = Brand<string, "PlayerId">;
export type GameId = Brand<string, "GameId">;
export type CardId = Brand<string, "CardId">;

export type Suit = "spades" | "hearts" | "diamonds" | "clubs";

export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

export interface Card {
  id: CardId;
  suit: Suit;
  rank: Rank;
  deckIndex?: number;
}

export interface TrickPlay {
  playerId: PlayerId;
  card: Card;
}

export interface CurrentTrick {
  leaderId: PlayerId;
  leadSuit?: Suit;
  plays: TrickPlay[];
}

export type GamePhase = "lobby" | "bidding" | "playing" | "round_end";

export type PlayerStatus = "active" | "left";

export interface PublicPlayer {
  id: string;
  playerId: PlayerId;
  name: string;
  score: number;
  tricks: number;
  bid?: number;
  cardCount: number;
  isHost: boolean;
  isSelf: boolean;
  status: PlayerStatus;
}

/** Game state payload sent from server to client on "gameState" event */
export interface GameStatePayload {
  id: GameId;
  phase: GamePhase;
  options: { numDecks: number; maxPlayers: number };
  players: PublicPlayer[];
  hand: Card[];
  spadesBroken: boolean;
  currentTrick?: CurrentTrick;
  roundNumber: number;
  statusMessage?: string;
  currentTurnPlayerId: PlayerId | null;
}

export interface PlayerState {
  id: string;
  playerId: PlayerId;
  name: string;
  hand: Card[];
  tricks: number;
  score: number;
  bid?: number;
  isHost: boolean;
  status: PlayerStatus;
}

export type GameOptions = {
  numDecks: number;
  maxPlayers: number;
};

export interface GameState {
  id: GameId;
  hostId: PlayerId;
  players: PlayerState[];
  options: GameOptions;
  phase: GamePhase;
  currentTrick?: CurrentTrick;
  spadesBroken: boolean;
  bidIndex: number;
  roundNumber: number;
  statusMessage?: string;
  /** Timestamp when the game was created; used for persistence and later cleanup of old games */
  createdAt: number;
}

export interface SerializedGame {
  id: GameId;
  phase: GamePhase;
  options: GameOptions;
  players: PublicPlayer[];
  hand: Card[];
  spadesBroken: boolean;
  currentTrick?: CurrentTrick;
  roundNumber: number;
  statusMessage?: string;
  currentTurnPlayerId: PlayerId | null;
}
