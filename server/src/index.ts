import cors from "cors";
import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
  GameOptions,
} from "shared";
import {
  MAX_DECKS,
  MAX_PLAYERS,
  MIN_DECKS,
  MIN_PLAYERS,
  serializeGame,
} from "./gameLogic";
import { cleanupOldGames, loadGames, saveGames } from "./persistence";
import type { GameState } from "shared";
import { createGameHandler } from "./handlers/createGame";
import { joinGameHandler } from "./handlers/joinGame";
import { startGameHandler } from "./handlers/startGame";
import { placeBidHandler } from "./handlers/placeBid";
import { playCardHandler } from "./handlers/playCard";
import { startNextRoundHandler } from "./handlers/startNextRound";
import { requestStateHandler } from "./handlers/requestState";
import { kickPlayerHandler } from "./handlers/kickPlayer";
import { disconnectHandler } from "./handlers/disconnect";
import type { HandlerContext } from "./handlers/types";

/** Remove persisted games older than this (e.g. 30 days) so storage doesn't grow forever */
const MAX_GAME_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const app = express();
app.use(cors());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const server = http.createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

const games = new Map<string, GameState>(loadGames());
const removed = cleanupOldGames(games, MAX_GAME_AGE_MS);
if (removed > 0) {
  saveGames(games);
  // eslint-disable-next-line no-console
  console.log(`Cleaned up ${removed} old game(s) (older than 30 days).`);
}
const playerToGame = new Map<string, string>();

function broadcast(game: GameState) {
  for (const player of game.players) {
    if (player.id) {
      io.to(player.id).emit("gameState", serializeGame(game, player.id));
    }
  }
}

function persistGames() {
  saveGames(games);
}

function validateOptions(options: Partial<GameOptions>): GameOptions {
  const numDecks = Math.min(
    Math.max(options.numDecks ?? 1, MIN_DECKS),
    MAX_DECKS,
  );
  const maxPlayers = Math.min(
    Math.max(options.maxPlayers ?? 4, MIN_PLAYERS),
    MAX_PLAYERS,
  );
  return { numDecks, maxPlayers };
}

io.on(
  "connection",
  (
    socket: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
  ) => {
    // eslint-disable-next-line no-console
    console.log(`Client connected: ${socket.id}`);

    const ctx: HandlerContext = {
      socket,
      io,
      games,
      playerToGame,
      broadcast,
      persistGames,
      validateOptions,
    };

    socket.on("createGame", createGameHandler(ctx));
    socket.on("joinGame", joinGameHandler(ctx));
    socket.on("startGame", startGameHandler(ctx));
    socket.on("placeBid", placeBidHandler(ctx));
    socket.on("playCard", playCardHandler(ctx));
    socket.on("startNextRound", startNextRoundHandler(ctx));
    socket.on("requestState", requestStateHandler(ctx));
    socket.on("kickPlayer", kickPlayerHandler(ctx));
    socket.on("disconnect", disconnectHandler(ctx));
    socket.on("disconnect", () => {
      // eslint-disable-next-line no-console
      console.log(`Client disconnected: ${socket.id}`);
    });
  },
);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const HOST = "0.0.0.0";
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
