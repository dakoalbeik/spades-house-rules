import type { OkErrorResponse } from "shared";
import type { HandlerContext } from "./types";

export function endGameHandler({
  socket,
  io,
  games,
  playerToGame,
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

    const player = game.players.find((p) => p.id === socket.id);
    if (!player?.isHost) {
      callback?.({ ok: false, error: "Only the host can end the game" });
      return;
    }

    // Notify all players before deleting
    for (const p of game.players) {
      if (p.id) {
        io.to(p.id).emit("gameEnded", "The host ended the game.");
      }
    }

    // Clean up server-side state
    for (const p of game.players) {
      playerToGame.delete(p.id);
    }
    games.delete(gameId);
    games.save();

    // eslint-disable-next-line no-console
    console.log(`Game ${gameId} ended by host`);
    callback?.({ ok: true });
  };
}
