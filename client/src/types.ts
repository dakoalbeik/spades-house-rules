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

export type Card = { id: string; suit: Suit; rank: Rank };

export type TrickPlay = {
  playerId: string;
  card: Card;
};

export type CurrentTrick = {
  leaderId: string;
  leadSuit?: Suit;
  plays: TrickPlay[];
};

export type GamePhase = "lobby" | "bidding" | "playing" | "round_end";

export type PublicPlayer = {
  id: string;
  name: string;
  score: number;
  tricks: number;
  bid?: number;
  cardCount: number;
  isHost: boolean;
  isSelf: boolean;
};

export type GameState = {
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
};

