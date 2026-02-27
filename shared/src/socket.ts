/**
 * Socket.IO typed events: shared between client and server.
 * @see https://socket.io/docs/v4/typescript
 */

import type { GameStatePayload } from "./game";

// --- Payloads (client → server) ---

export interface CreateGamePayload {
  playerName?: string;
  numDecks?: number;
  maxPlayers?: number;
}

export interface JoinGamePayload {
  gameId: string;
  playerName?: string;
}

export interface StartGamePayload {
  gameId: string;
}

export interface PlaceBidPayload {
  gameId: string;
  bid: number;
}

export interface PlayCardPayload {
  gameId: string;
  cardId: string;
}

export interface StartNextRoundPayload {
  gameId: string;
}

export interface RequestStatePayload {
  gameId: string;
}

// --- Responses (server → client via callback) ---

export interface GameResponse {
  ok: boolean;
  error?: string;
  gameId?: string;
}

export interface OkErrorResponse {
  ok: boolean;
  error?: string;
}

// --- Event maps ---

/** Events the server listens for (client emits these) */
export interface ClientToServerEvents {
  createGame: (
    payload: CreateGamePayload,
    callback?: (response: GameResponse) => void
  ) => void;
  joinGame: (
    payload: JoinGamePayload,
    callback?: (response: GameResponse) => void
  ) => void;
  startGame: (
    payload: StartGamePayload,
    callback?: (response: OkErrorResponse) => void
  ) => void;
  placeBid: (
    payload: PlaceBidPayload,
    callback?: (response: OkErrorResponse) => void
  ) => void;
  playCard: (
    payload: PlayCardPayload,
    callback?: (response: OkErrorResponse) => void
  ) => void;
  startNextRound: (
    payload: StartNextRoundPayload,
    callback?: (response: OkErrorResponse) => void
  ) => void;
  requestState: (payload: RequestStatePayload) => void;
}

/** Events the client listens for (server emits these) */
export interface ServerToClientEvents {
  gameState: (state: GameStatePayload) => void;
}

/** Inter-server events (optional; not used in this app) */
export interface InterServerEvents {
  // ping: () => void;
}

/** Data attached to socket.data (optional) */
export interface SocketData {
  // name?: string;
}
