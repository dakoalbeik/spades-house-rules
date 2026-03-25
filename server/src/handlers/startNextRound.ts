import type { StartNextRoundPayload, OkErrorResponse } from "shared";
import { startNextRound } from "../gameLogic";
import type { HandlerContext } from "./types";

export function startNextRoundHandler({
  socket,
  games,
  broadcast,
}: HandlerContext) {
  return (payload: StartNextRoundPayload, callback?: (r: OkErrorResponse) => void) => {
    const game = games.get(payload?.gameId) ?? null;
    if (!game) {
      callback?.({ ok: false, error: "Game not found" });
      return;
    }
    const hostPlayer = game.players.find((p) => p.id === socket.id);
    if (!hostPlayer?.isHost) {
      callback?.({ ok: false, error: "Only host can start next round" });
      return;
    }
    const result = startNextRound(game);
    if (!result.ok) {
      callback?.({ ok: false, error: result.error });
      return;
    }
    broadcast(game);
    games.save();
    callback?.({ ok: true });
  };
}
