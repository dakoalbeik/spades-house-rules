/**
 * Socket.IO typed events: shared between client and server.
 * @see https://socket.io/docs/v4/typescript
 */

import type { GameStatePayload, GameId, PlayerId, CardId } from "./game";

// --- Payloads (client → server) ---

export interface CreateGamePayload {
  playerName?: string;
  numDecks?: number;
  maxPlayers?: number;
  nilScore?: number;
}

export interface JoinGamePayload {
  gameId: GameId;
  playerName?: string;
  /** Stable player id (from session storage) to rejoin after refresh */
  playerId?: PlayerId;
}

export interface StartGamePayload {
  gameId: GameId;
}

export interface PlaceBidPayload {
  gameId: GameId;
  playerId: PlayerId;
  bid: number;
}

export interface PlayCardPayload {
  gameId: GameId;
  playerId: PlayerId;
  cardId: CardId;
}

export interface ResolveDuplicateCardPayload {
  gameId: GameId;
  playerId: PlayerId;
  /** "win" — the duplicate card wins the trick; "lose" — normal resolution applies */
  choice: "win" | "lose";
}

export interface StartNextRoundPayload {
  gameId: GameId;
}

export interface KickPlayerPayload {
  gameId: GameId;
  /** Stable playerId of the player to kick */
  playerId: PlayerId;
}

export interface RequestStatePayload {
  gameId: GameId;
}

// --- Responses (server → client via callback) ---

export interface GameResponse {
  ok: boolean;
  error?: string;
  gameId?: GameId;
  /** Stable player id for this tab; save to session storage for rejoin */
  playerId?: PlayerId;
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
  resolveDuplicateCard: (
    payload: ResolveDuplicateCardPayload,
    callback?: (response: OkErrorResponse) => void
  ) => void;
  startNextRound: (
    payload: StartNextRoundPayload,
    callback?: (response: OkErrorResponse) => void
  ) => void;
  kickPlayer: (
    payload: KickPlayerPayload,
    callback?: (response: OkErrorResponse) => void
  ) => void;
  leaveGame: (
    payload: { gameId: string },
    callback?: (response: OkErrorResponse) => void
  ) => void;
  cancelRound: (
    payload: { gameId: string },
    callback?: (response: OkErrorResponse) => void
  ) => void;
  endGame: (
    payload: { gameId: string },
    callback?: (response: OkErrorResponse) => void
  ) => void;
  requestState: (payload: RequestStatePayload) => void;
}

/** Events the client listens for (server emits these) */
export interface ServerToClientEvents {
  gameState: (state: GameStatePayload) => void;
  /** Emitted to a socket when the host kicks them from the lobby */
  kicked: (message?: string) => void;
  /** Emitted to all players when the host ends the game */
  gameEnded: (message?: string) => void;
}

/** Inter-server events (optional; not used in this app) */
export interface InterServerEvents {
  // ping: () => void;
}

/** Data attached to socket.data (optional) */
export interface SocketData {
  // name?: string;
}
