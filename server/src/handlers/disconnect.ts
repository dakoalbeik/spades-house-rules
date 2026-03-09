import { advanceLeftPlayers, removePlayer, setPlayerLeft } from "../gameLogic";
import type { HandlerContext } from "./types";

export function disconnectHandler({
  socket,
  games,
  playerToGame,
  broadcast,
  persistGames,
}: HandlerContext) {
  return () => {
    const gameId = playerToGame.get(socket.id);
    if (!gameId) return;
    const game = games.get(gameId);
    if (!game) return;
    playerToGame.delete(socket.id);

    if (game.phase === "lobby") {
      removePlayer(game, socket.id);
      persistGames();
      if (game.players.length > 0) {
        broadcast(game);
      }
      return;
    }

    setPlayerLeft(game, socket.id);
    advanceLeftPlayers(game);
    persistGames();
    broadcast(game);
  };
}
