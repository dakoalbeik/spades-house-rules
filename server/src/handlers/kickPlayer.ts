import type { KickPlayerPayload, OkErrorResponse, SocketId } from "shared";
import { removePlayer } from "../gameLogic";
import type { HandlerContext } from "./types";

export function kickPlayerHandler({
  socket,
  io,
  games,
  connections,
  broadcast,
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
    const requesterId = connections.getPlayerForSocket(socket.id as SocketId);
    const requester = requesterId ? game.players.find((p) => p.playerId === requesterId) : undefined;
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
    removePlayer(game, toKick.playerId);
    const kickedSockets = connections.unregisterPlayer(toKick.playerId);
    broadcast(game);
    games.save();
    for (const sid of kickedSockets) {
      io.to(sid).emit("kicked", "You were kicked from the lobby");
      io.sockets.sockets.get(sid)?.leave(gameId);
    }
    callback?.({ ok: true });
  };
}
