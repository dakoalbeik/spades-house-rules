import { Router } from "express";
import type { Server } from "socket.io";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
  GameState,
} from "shared";
import type { GameRepository } from "../games/GameRepository";
import type { AutoAdvanceScheduler } from "../games/AutoAdvanceScheduler";
import type { ConnectionRegistry } from "../connections/ConnectionRegistry";

type IoServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

function serializeGame(g: GameState) {
  return {
    id: g.id,
    phase: g.phase,
    ongoing: g.phase !== "lobby",
    roundNumber: g.roundNumber,
    options: g.options,
    createdAt: g.createdAt,
    autoBid: g.autoBid ?? false,
    autoPlay: g.autoPlay ?? false,
    currentTurnPlayerId: g.phase === "bidding"
      ? g.players[g.bidIndex]?.playerId ?? null
      : g.currentTrick
        ? g.players.find((p) =>
            g.currentTrick!.plays.length < g.players.length &&
            !g.currentTrick!.plays.some((pl) => pl.playerId === p.playerId),
          )?.playerId ?? null
        : null,
    players: g.players.map((p) => ({
      playerId: p.playerId,
      name: p.name,
      score: p.score,
      bid: p.bid,
      tricks: p.tricks,
      status: p.status,
      isHost: p.isHost,
    })),
  };
}

export function createAdminRouter(
  games: GameRepository,
  connections: ConnectionRegistry,
  io: IoServer,
  adminPassword: string,
  scheduler: AutoAdvanceScheduler,
  broadcast: (g: GameState) => void,
) {
  const router = Router();

  function requireAdmin(
    req: import("express").Request,
    res: import("express").Response,
    next: import("express").NextFunction,
  ) {
    const password = req.headers["x-admin-password"];
    if (password !== adminPassword) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
    next();
  }

  router.get("/games", requireAdmin, (_req, res) => {
    res.json({ ok: true, games: games.all().map(serializeGame) });
  });

  router.get("/games/:gameId", requireAdmin, (req, res) => {
    const game = games.get(req.params.gameId.toUpperCase());
    if (!game) {
      res.status(404).json({ ok: false, error: "Game not found" });
      return;
    }
    res.json({ ok: true, game: serializeGame(game) });
  });

  router.patch("/games/:gameId/settings", requireAdmin, (req, res) => {
    const game = games.get(req.params.gameId.toUpperCase());
    if (!game) {
      res.status(404).json({ ok: false, error: "Game not found" });
      return;
    }
    const { autoBid, autoPlay } = req.body as {
      autoBid?: boolean;
      autoPlay?: boolean;
    };
    if (typeof autoBid === "boolean") game.autoBid = autoBid;
    if (typeof autoPlay === "boolean") game.autoPlay = autoPlay;
    games.save();
    // Kick off auto-advance immediately if a flag was just enabled
    scheduler.schedule(game, games, broadcast);
    res.json({ ok: true, game: serializeGame(game) });
  });

  router.delete("/games/:gameId", requireAdmin, (req, res) => {
    const game = games.get(req.params.gameId.toUpperCase());
    if (!game) {
      res.status(404).json({ ok: false, error: "Game not found" });
      return;
    }
    scheduler.cancel(game.id);
    for (const player of game.players) {
      for (const sid of connections.getSocketsForPlayer(player.playerId)) {
        io.to(sid).emit("gameEnded", "Game was deleted by an administrator");
      }
      connections.unregisterPlayer(player.playerId);
    }
    games.delete(req.params.gameId.toUpperCase());
    games.save();
    res.json({ ok: true });
  });

  return router;
}
