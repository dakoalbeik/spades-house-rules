import { Router } from "express";
import type { Server } from "socket.io";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "shared";
import type { GameRepository } from "../games/GameRepository";

type IoServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export function createAdminRouter(
  games: GameRepository,
  playerToGame: Map<string, string>,
  io: IoServer,
  adminPassword: string,
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
    const list = games.all().map((g) => ({
      id: g.id,
      phase: g.phase,
      ongoing: g.phase !== "lobby",
      roundNumber: g.roundNumber,
      options: g.options,
      createdAt: g.createdAt,
      players: g.players.map((p) => ({
        name: p.name,
        score: p.score,
        status: p.status,
        isHost: p.isHost,
      })),
    }));
    res.json({ ok: true, games: list });
  });

  router.delete("/games/:gameId", requireAdmin, (req, res) => {
    const game = games.get(req.params.gameId);
    if (!game) {
      res.status(404).json({ ok: false, error: "Game not found" });
      return;
    }
    for (const player of game.players) {
      if (player.id) {
        io.to(player.id).emit(
          "gameEnded",
          "Game was deleted by an administrator",
        );
        playerToGame.delete(player.id);
      }
    }
    games.delete(req.params.gameId);
    games.save();
    res.json({ ok: true });
  });

  return router;
}
