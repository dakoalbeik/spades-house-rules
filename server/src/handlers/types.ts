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

export type AppSocket = Omit<
  Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
  "id"
> & {
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
