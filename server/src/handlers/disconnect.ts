import { advanceLeftPlayers, removePlayer, setPlayerLeft } from "../gameLogic";
import type { HandlerContext } from "./types";
import type { SocketId } from "shared";

export function disconnectHandler({
  socket,
  games,
  connections,
  broadcast,
}: HandlerContext) {
  return () => {
    const playerId = connections.getPlayerForSocket(socket.id);
    if (!playerId) return;
    const gameId = connections.getGameForPlayer(playerId);
    const { remainingSockets } = connections.unregisterSocket(socket.id);

    // Player still connected on another tab/device — no game-state change needed
    if (remainingSockets > 0) return;

    if (!gameId) return;
    const game = games.get(gameId);
    if (!game) return;

    if (game.phase === "lobby") {
      removePlayer(game, playerId);
      games.save();
      if (game.players.length > 0) {
        broadcast(game);
      }
      return;
    }

    setPlayerLeft(game, playerId);
    advanceLeftPlayers(game);
    games.save();
    broadcast(game);
  };
}
