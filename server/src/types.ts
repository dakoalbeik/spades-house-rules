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
  deckIndex: number;
}

export interface PlayerState {
  id: string;
  name: string;
  hand: Card[];
  bid?: number;
  tricks: number;
  score: number;
  isHost: boolean;
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

export interface GameOptions {
  numDecks: number;
  maxPlayers: number;
}

export interface GameState {
  id: string;
  hostId: string;
  players: PlayerState[];
  options: GameOptions;
  phase: GamePhase;
  currentTrick?: CurrentTrick;
  spadesBroken: boolean;
  bidIndex: number;
  roundNumber: number;
  statusMessage?: string;
}

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

export interface SerializedGame {
  id: string;
  phase: GamePhase;
  options: GameOptions;
  players: PublicPlayer[];
  hand: Card[];
  spadesBroken: boolean;
  currentTrick?: CurrentTrick;
  roundNumber: number;
  statusMessage?: string;
  currentTurnPlayerId: string | null;
}

