import cors from "cors";
import express from "express";
import http from "http";
import path from "path";
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
import type { GameState } from "shared";
import { InMemoryGameRepository } from "./games/InMemoryGameRepository";
import { createGameHandler } from "./handlers/createGame";
import { joinGameHandler } from "./handlers/joinGame";
import { startGameHandler } from "./handlers/startGame";
import { placeBidHandler } from "./handlers/placeBid";
import { playCardHandler } from "./handlers/playCard";
import { startNextRoundHandler } from "./handlers/startNextRound";
import { requestStateHandler } from "./handlers/requestState";
import { kickPlayerHandler } from "./handlers/kickPlayer";
import { leaveGameHandler } from "./handlers/leaveGame";
import { cancelRoundHandler } from "./handlers/cancelRound";
import { endGameHandler } from "./handlers/endGame";
import { resolveDuplicateCardHandler } from "./handlers/resolveDuplicateCard";
import { disconnectHandler } from "./handlers/disconnect";
import type { AppSocket, HandlerContext } from "./handlers/types";
import { createAdminRouter } from "./admin/router";
import { AutoAdvanceScheduler } from "./games/AutoAdvanceScheduler";
import { ConnectionRegistry } from "./connections/ConnectionRegistry";

/** Remove persisted games older than this (e.g. 30 days) so storage doesn't grow forever */
const MAX_GAME_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.resolve(__dirname, "../client/dist")));

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

const games = new InMemoryGameRepository();
const removed = games.cleanup(MAX_GAME_AGE_MS);
if (removed > 0) {
  games.save();
  // eslint-disable-next-line no-console
  console.log(`Cleaned up ${removed} old game(s) (older than 30 days).`);
}
const connections = new ConnectionRegistry();
const scheduler = new AutoAdvanceScheduler();

function broadcast(game: GameState) {
  for (const player of game.players) {
    for (const socketId of connections.getSocketsForPlayer(player.playerId)) {
      io.to(socketId).emit("gameState", serializeGame(game, player.playerId));
    }
  }
  scheduler.schedule(game, games, broadcast);
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin";
if (!process.env.ADMIN_PASSWORD) {
  // eslint-disable-next-line no-console
  console.warn(
    "WARNING: ADMIN_PASSWORD not set. Using default 'admin'. Set ADMIN_PASSWORD in production.",
  );
}
app.use(
  "/admin",
  createAdminRouter(
    games,
    connections,
    io,
    ADMIN_PASSWORD,
    scheduler,
    broadcast,
  ),
);

function validateOptions(options: Partial<GameOptions>): GameOptions {
  const numDecks = Math.min(
    Math.max(options.numDecks ?? 1, MIN_DECKS),
    MAX_DECKS,
  );
  const maxPlayers = Math.min(
    Math.max(options.maxPlayers ?? 4, MIN_PLAYERS),
    MAX_PLAYERS,
  );
  const nilScore = Math.max(0, Math.round(options.nilScore ?? 100));
  return { numDecks, maxPlayers, nilScore };
}

io.on("connection", (s: Socket) => {
  const socket = s as unknown as AppSocket;
  // eslint-disable-next-line no-console
  console.log(`Client connected: ${socket.id}`);

  const ctx: HandlerContext = {
    socket,
    io,
    games,
    connections,
    broadcast,
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
  socket.on("leaveGame", leaveGameHandler(ctx));
  socket.on("cancelRound", cancelRoundHandler(ctx));
  socket.on("endGame", endGameHandler(ctx));
  socket.on("resolveDuplicateCard", resolveDuplicateCardHandler(ctx));
  socket.on("disconnect", disconnectHandler(ctx));
  socket.on("disconnect", () => {
    // eslint-disable-next-line no-console
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const HOST = "0.0.0.0";

// Serve SPA fallback - must be after all other routes
app.use((req, res) => {
  const filePath = path.join(__dirname, "../client/dist/index.html");
  res.sendFile(filePath, (err) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error("Error serving index.html:", err);
      res.status(404).json({ error: "Not found" });
    }
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://${HOST}:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Serving SPA from: ${path.resolve(__dirname, "../client/dist")}`);
});
