import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
  GameOptions,
} from "shared";
import type { GameState } from "shared";

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export interface HandlerContext {
  socket: AppSocket;
  io: AppServer;
  games: Map<string, GameState>;
  playerToGame: Map<string, string>;
  broadcast: (game: GameState) => void;
  persistGames: () => void;
  validateOptions: (options: Partial<GameOptions>) => GameOptions;
}
