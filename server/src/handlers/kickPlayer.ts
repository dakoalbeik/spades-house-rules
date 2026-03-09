import type { KickPlayerPayload, OkErrorResponse } from "shared";
import { removePlayer } from "../gameLogic";
import type { HandlerContext } from "./types";

export function kickPlayerHandler({
  socket,
  io,
  games,
  playerToGame,
  broadcast,
  persistGames,
}: HandlerContext) {
  return (payload: KickPlayerPayload, callback?: (r: OkErrorResponse) => void) => {
    const gameId = payload?.gameId?.trim().toUpperCase();
    if (!gameId) {
      callback?.({ ok: false, error: "Game ID is required" });
      return;
    }
    const game = games.get(gameId) ?? null;
    if (!game) {
      callback?.({ ok: false, error: "Game not found" });
      return;
    }
    if (game.phase !== "lobby") {
      callback?.({ ok: false, error: "Can only kick players in the lobby" });
      return;
    }
    const requester = game.players.find((p) => p.id === socket.id);
    if (!requester?.isHost) {
      callback?.({ ok: false, error: "Only the host can kick players" });
      return;
    }
    const targetPlayerId = payload?.playerId?.trim();
    if (!targetPlayerId) {
      callback?.({ ok: false, error: "Player to kick is required" });
      return;
    }
    const toKick = game.players.find((p) => p.playerId === targetPlayerId);
    if (!toKick) {
      callback?.({ ok: false, error: "Player not in this game" });
      return;
    }
    if (toKick.isHost) {
      callback?.({ ok: false, error: "Cannot kick the host" });
      return;
    }
    const kickedSocketId = toKick.id;
    removePlayer(game, kickedSocketId);
    playerToGame.delete(kickedSocketId);
    broadcast(game);
    persistGames();
    if (kickedSocketId) {
      io.to(kickedSocketId).emit("kicked", "You were kicked from the lobby");
      io.sockets.sockets.get(kickedSocketId)?.leave(gameId);
    }
    callback?.({ ok: true });
  };
}
