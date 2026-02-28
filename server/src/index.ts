import { randomUUID } from "crypto";
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
import { cleanupOldGames, loadGames, saveGames } from "./persistence";
import { GameOptions, GameState } from "./types";

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

function withGame(gameId: string): GameState | null {
  const game = games.get(gameId);
  return game ?? null;
}

function broadcast(game: GameState) {
  for (const player of game.players) {
    io.to(player.id).emit("gameState", serializeGame(game, player.id));
  }
}

function persistGames() {
  saveGames(games);
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
      persistGames();
      callback?.({ ok: true, gameId: game.id, playerId: game.players[0].playerId });
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

      // Check if player is already in this game (same socket)
      const alreadyInGame = game.players.find((p) => p.id === socket.id);
      if (alreadyInGame) {
        // eslint-disable-next-line no-console
        console.log(`Player ${socket.id} already in game ${gameIdUpper}`);
        broadcast(game);
        callback?.({ ok: true, gameId: game.id, playerId: alreadyInGame.playerId });
        return;
      }

      const name = (payload?.playerName ?? "Player").trim() || "Player";
      const rejoinPlayerId = payload?.playerId?.trim();

      if (game.phase !== "lobby") {
        // Rejoin in-progress game: find by stable playerId first, then by name
        const slot =
          (rejoinPlayerId && game.players.find((p) => p.playerId === rejoinPlayerId)) ||
          game.players.find((p) => p.name === name);
        if (!slot) {
          callback?.({
            ok: false,
            error: rejoinPlayerId
              ? "No player in this game with that session. Re-enter the game ID and your name to rejoin."
              : "No player with that name in this game",
          });
          return;
        }
        if (game.hostId === slot.id) {
          game.hostId = socket.id;
        }
        slot.id = socket.id;
        playerToGame.set(socket.id, game.id);
        socket.join(game.id);
        // eslint-disable-next-line no-console
        console.log(`Player ${socket.id} (${slot.name}) rejoined game ${game.id}`);
        broadcast(game);
        persistGames();
        callback?.({ ok: true, gameId: game.id, playerId: slot.playerId });
        return;
      }

      if (game.players.length >= game.options.maxPlayers) {
        callback?.({ ok: false, error: "Game is full" });
        return;
      }

      const stablePlayerId = randomUUID();
      game.players.push({
        id: socket.id,
        playerId: stablePlayerId,
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
      persistGames();
      callback?.({ ok: true, gameId: game.id, playerId: stablePlayerId });
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
      persistGames();
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
      persistGames();
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
      persistGames();
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
      persistGames();
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
    // Keep the game so clients can reconnect later; never delete here
    persistGames();
    if (game.players.length > 0) {
      broadcast(game);
    }
  });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const HOST = "0.0.0.0";
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
