import { cancelRound } from "../gameLogic";
import type { OkErrorResponse } from "shared";
import type { HandlerContext } from "./types";

export function cancelRoundHandler({
  socket,
  games,
  playerToGame,
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

    const player = game.players.find((p) => p.id === socket.id);
    if (!player?.isHost) {
      callback?.({ ok: false, error: "Only the host can dismiss a round" });
      return;
    }

    const result = cancelRound(game);
    if (!result.ok) {
      callback?.({ ok: false, error: result.error });
      return;
    }

    games.save();
    broadcast(game);
    callback?.({ ok: true });
  };
}
