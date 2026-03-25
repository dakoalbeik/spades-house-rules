import type { OkErrorResponse, SocketId } from "shared";
import type { HandlerContext } from "./types";

export function endGameHandler({
  socket,
  io,
  games,
  connections,
}: HandlerContext) {
  return (
    payload: { gameId: string },
    callback?: (r: OkErrorResponse) => void,
  ) => {
    const gameId = payload?.gameId?.trim().toUpperCase();
    const game = games.get(gameId);
    if (!game) {
      callback?.({ ok: false, error: "Game not found" });
      return;
    }

    const requesterId = connections.getPlayerForSocket(socket.id as SocketId);
    const player = requesterId ? game.players.find((p) => p.playerId === requesterId) : undefined;
    if (!player?.isHost) {
      callback?.({ ok: false, error: "Only the host can end the game" });
      return;
    }

    // Notify all sockets of all players, then clean up registry
    for (const p of game.players) {
      for (const sid of connections.getSocketsForPlayer(p.playerId)) {
        io.to(sid).emit("gameEnded", "The host ended the game.");
      }
      connections.unregisterPlayer(p.playerId);
    }
    games.delete(gameId);
    games.save();

    // eslint-disable-next-line no-console
    console.log(`Game ${gameId} ended by host`);
    callback?.({ ok: true });
  };
}
