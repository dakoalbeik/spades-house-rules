import type { OkErrorResponse, SocketId } from "shared";
import { advanceLeftPlayers, removePlayer, setPlayerLeft } from "../gameLogic";
import type { HandlerContext } from "./types";

export function leaveGameHandler({
  socket,
  io,
  games,
  connections,
  broadcast,
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

    const playerId = connections.getPlayerForSocket(socket.id as SocketId);
    if (!playerId) {
      callback?.({ ok: false, error: "Not in this game" });
      return;
    }

    // Remove all sockets for this player from the registry and room
    const sockets = connections.unregisterPlayer(playerId);
    for (const sid of sockets) {
      io.sockets.sockets.get(sid)?.leave(gameId);
    }

    if (game.phase === "lobby") {
      removePlayer(game, playerId);
      games.save();
      if (game.players.length > 0) {
        broadcast(game);
      }
    } else {
      setPlayerLeft(game, playerId);
      advanceLeftPlayers(game);
      games.save();
      broadcast(game);
    }

    // eslint-disable-next-line no-console
    console.log(`Player ${socket.id} left game ${gameId}`);
    callback?.({ ok: true });
  };
}
