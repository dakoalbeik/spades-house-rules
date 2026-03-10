import type { OkErrorResponse } from "shared";
import { advanceLeftPlayers, removePlayer, setPlayerLeft } from "../gameLogic";
import type { HandlerContext } from "./types";

export function leaveGameHandler({
  socket,
  games,
  playerToGame,
  broadcast,
  persistGames,
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

    playerToGame.delete(socket.id);
    socket.leave(gameId);

    if (game.phase === "lobby") {
      removePlayer(game, socket.id);
      persistGames();
      if (game.players.length > 0) {
        broadcast(game);
      }
    } else {
      setPlayerLeft(game, socket.id);
      advanceLeftPlayers(game);
      persistGames();
      broadcast(game);
    }

    // eslint-disable-next-line no-console
    console.log(`Player ${socket.id} left game ${gameId}`);
    callback?.({ ok: true });
  };
}
