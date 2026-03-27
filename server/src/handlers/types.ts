import { SocketId } from "./../../node_modules/shared/src/game";
import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
  GameOptions,
} from "shared";
import type { GameState } from "shared";
import type { GameRepository } from "../games/GameRepository";
import type { ConnectionRegistry } from "../connections/ConnectionRegistry";

type BaseSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/**
 * AppSocket is a wrapper around Socket that has the correct SocketId type for its id field, so we don't have to cast it everywhere.
 */
export type AppSocket = Omit<BaseSocket, "id"> & {
  id: SocketId;
};

export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export interface HandlerContext {
  socket: AppSocket;
  io: AppServer;
  games: GameRepository;
  connections: ConnectionRegistry;
  broadcast: (game: GameState) => void;
  validateOptions: (options: Partial<GameOptions>) => GameOptions;
}
