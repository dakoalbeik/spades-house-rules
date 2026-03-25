/**
 * Shared types for the game state sent over the socket (server → client).
 * Keeps client and server in sync on the wire format.
 */

import { Brand } from "./general";

export type PlayerId = Brand<string, "PlayerId">;
export type GameId = Brand<string, "GameId">;
export type CardId = Brand<string, "CardId">;
export type SocketId = Brand<string, "SocketId">;

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

/** Broadcast between "all cards played" and "trick cleared" so clients can animate.
 *  The trick's plays are still present in currentTrick during this window. */
export interface TrickResolution {
  winnerId: PlayerId;
  winnerName: string;
}

/** Set when the last card played duplicates an earlier card (same rank+suit).
 *  The identified player must choose "win" or "lose" before the trick resolves. */
export interface PendingDuplicateChoice {
  /** The player who played the last duplicate card */
  playerId: PlayerId;
  /** The duplicate card they played */
  card: Card;
}

export type GamePhase = "lobby" | "bidding" | "playing" | "round_end";

/** A speech bubble shown near a player's name.
 *  clearOn: "trick_end" = cleared when the trick finalizes;
 *           number      = unix timestamp (ms) after which it is no longer shown. */
export interface ChatBubble {
  message: string;
  clearOn: "trick_end" | number;
}

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
  /** Present when a player must choose to win or lose a trick due to a duplicate card */
  pendingDuplicateChoice?: PendingDuplicateChoice;
  /** Set during the delay between trick completion and trick clearance, for client animations */
  trickResolution?: TrickResolution;
  /** Chat bubbles to show near each player; keyed by playerId */
  chatBubbles?: Record<string, ChatBubble>;
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
  /** Points awarded for a made nil bid, deducted for a failed one */
  nilScore: number;
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
  /** Present when a player must choose to win or lose a trick due to a duplicate card */
  pendingDuplicateChoice?: PendingDuplicateChoice;
  /** Stored after the player makes their duplicate choice; used by finalizeTrick for tie-breaking */
  resolvedDuplicateChoice?: { lastDuplicatePlayerId: PlayerId; choice: "win" | "lose" };
  /** Set during the delay between trick completion and trick clearance, for client animations */
  trickResolution?: TrickResolution;
  /** Chat bubbles shown near each player; keyed by playerId string */
  chatBubbles: Record<string, ChatBubble>;
  /** Admin-controlled: server automatically places bids for all players */
  autoBid?: boolean;
  /** Admin-controlled: server automatically plays cards for all players */
  autoPlay?: boolean;
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
  pendingDuplicateChoice?: PendingDuplicateChoice;
  /** Set during the delay between trick completion and trick clearance, for client animations */
  trickResolution?: TrickResolution;
  /** Chat bubbles to show near each player; keyed by playerId */
  chatBubbles?: Record<string, ChatBubble>;
}
