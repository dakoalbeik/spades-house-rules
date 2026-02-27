/**
 * Shared types for the game state sent over the socket (server → client).
 * Keeps client and server in sync on the wire format.
 */

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
  id: string;
  suit: Suit;
  rank: Rank;
  deckIndex?: number;
}

export interface TrickPlay {
  playerId: string;
  card: Card;
}

export interface CurrentTrick {
  leaderId: string;
  leadSuit?: Suit;
  plays: TrickPlay[];
}

export type GamePhase = "lobby" | "bidding" | "playing" | "round_end";

export interface PublicPlayer {
  id: string;
  name: string;
  score: number;
  tricks: number;
  bid?: number;
  cardCount: number;
  isHost: boolean;
  isSelf: boolean;
}

/** Game state payload sent from server to client on "gameState" event */
export interface GameStatePayload {
  id: string;
  phase: GamePhase;
  options: { numDecks: number; maxPlayers: number };
  players: PublicPlayer[];
  hand: Card[];
  spadesBroken: boolean;
  currentTrick?: CurrentTrick;
  roundNumber: number;
  statusMessage?: string;
  currentTurnPlayerId: string | null;
}
