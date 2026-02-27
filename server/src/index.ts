import cors from "cors";
import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "shared";
import {
  MAX_DECKS,
  MAX_PLAYERS,
  MIN_DECKS,
  MIN_PLAYERS,
  createGame,
  placeBid,
  playCard,
  removePlayer,
  serializeGame,
  startNextRound,
  startRound,
} from "./gameLogic";
import { GameOptions, GameState } from "./types";

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

const games = new Map<string, GameState>();
const playerToGame = new Map<string, string>();

function withGame(gameId: string): GameState | null {
  const game = games.get(gameId);
  return game ?? null;
}

function broadcast(game: GameState) {
  for (const player of game.players) {
    io.to(player.id).emit("gameState", serializeGame(game, player.id));
  }
}

function validateOptions(options: Partial<GameOptions>): GameOptions {
  const numDecks = Math.min(
    Math.max(options.numDecks ?? 1, MIN_DECKS),
    MAX_DECKS
  );
  const maxPlayers = Math.min(
    Math.max(options.maxPlayers ?? 4, MIN_PLAYERS),
    MAX_PLAYERS
  );
  return { numDecks, maxPlayers };
}

io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
  // eslint-disable-next-line no-console
  console.log(`Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    // eslint-disable-next-line no-console
    console.log(`Client disconnected: ${socket.id}`);
  });

  socket.on("createGame", (payload, callback) => {
      const name = (payload?.playerName ?? "Host").trim() || "Host";
      const options = validateOptions({
        numDecks: payload?.numDecks,
        maxPlayers: payload?.maxPlayers,
      });

      let game = createGame(socket.id, name, options);
      while (games.has(game.id)) {
        game = createGame(socket.id, name, options);
      }
      games.set(game.id, game);
      playerToGame.set(socket.id, game.id);
      socket.join(game.id);
      broadcast(game);
      callback?.({ ok: true, gameId: game.id });
    }
  );

  socket.on("joinGame", (payload, callback) => {
      const gameIdUpper = payload?.gameId?.trim().toUpperCase();
      if (!gameIdUpper) {
        callback?.({ ok: false, error: "Game ID is required" });
        return;
      }

      // eslint-disable-next-line no-console
      console.log(
        `Join attempt: ${socket.id} trying to join game ${gameIdUpper}`
      );

      const game = withGame(gameIdUpper);
      if (!game) {
        // eslint-disable-next-line no-console
        console.log(`Game ${gameIdUpper} not found`);
        callback?.({ ok: false, error: `Game "${gameIdUpper}" not found` });
        return;
      }

      // Check if player is already in this game
      const alreadyInGame = game.players.some((p) => p.id === socket.id);
      if (alreadyInGame) {
        // eslint-disable-next-line no-console
        console.log(`Player ${socket.id} already in game ${gameIdUpper}`);
        broadcast(game);
        callback?.({ ok: true, gameId: game.id });
        return;
      }

      if (game.phase !== "lobby") {
        callback?.({ ok: false, error: "Game already started" });
        return;
      }
      if (game.players.length >= game.options.maxPlayers) {
        callback?.({ ok: false, error: "Game is full" });
        return;
      }

      const name = (payload?.playerName ?? "Player").trim() || "Player";
      game.players.push({
        id: socket.id,
        name,
        hand: [],
        tricks: 0,
        score: 0,
        isHost: false,
      });
      playerToGame.set(socket.id, game.id);
      socket.join(game.id);

      // eslint-disable-next-line no-console
      console.log(
        `Player ${socket.id} (${name}) joined game ${game.id}. Total players: ${game.players.length}`
      );

      broadcast(game);
      callback?.({ ok: true, gameId: game.id });
    }
  );

  socket.on("startGame", (payload, callback) => {
      const game = withGame(payload?.gameId);
      if (!game) {
        callback?.({ ok: false, error: "Game not found" });
        return;
      }
      if (game.hostId !== socket.id) {
        callback?.({ ok: false, error: "Only host can start" });
        return;
      }
      if (game.phase !== "lobby" && game.phase !== "round_end") {
        callback?.({ ok: false, error: "Game already in progress" });
        return;
      }
      const result = startRound(game);
      if (!result.ok) {
        callback?.({ ok: false, error: result.error });
        return;
      }
      broadcast(game);
      callback?.({ ok: true });
    }
  );

  socket.on("placeBid", (payload, callback) => {
      const game = withGame(payload?.gameId);
      if (!game) {
        callback?.({ ok: false, error: "Game not found" });
        return;
      }
      const result = placeBid(game, socket.id, Number(payload?.bid));
      if (!result.ok) {
        callback?.({ ok: false, error: result.error });
        return;
      }
      broadcast(game);
      callback?.({ ok: true });
    }
  );

  socket.on("playCard", (payload, callback) => {
      const game = withGame(payload?.gameId);
      if (!game) {
        callback?.({ ok: false, error: "Game not found" });
        return;
      }
      const result = playCard(game, socket.id, payload.cardId);
      if (!result.ok) {
        callback?.({ ok: false, error: result.error });
        return;
      }
      broadcast(game);
      callback?.({ ok: true });
    }
  );

  socket.on("startNextRound", (payload, callback) => {
      const game = withGame(payload?.gameId);
      if (!game) {
        callback?.({ ok: false, error: "Game not found" });
        return;
      }
      if (game.hostId !== socket.id) {
        callback?.({ ok: false, error: "Only host can start next round" });
        return;
      }
      const result = startNextRound(game);
      if (!result.ok) {
        callback?.({ ok: false, error: result.error });
        return;
      }
      broadcast(game);
      callback?.({ ok: true });
    }
  );

  socket.on("requestState", (payload) => {
    const game = withGame(payload?.gameId);
    if (!game) return;
    socket.emit("gameState", serializeGame(game, socket.id));
  });

  socket.on("disconnect", () => {
    const gameId = playerToGame.get(socket.id);
    if (!gameId) return;
    const game = games.get(gameId);
    if (!game) return;
    removePlayer(game, socket.id);
    playerToGame.delete(socket.id);
    if (game.players.length === 0) {
      games.delete(gameId);
      return;
    }
    broadcast(game);
  });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const HOST = "0.0.0.0";
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
