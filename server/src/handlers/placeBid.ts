import type { PlaceBidPayload, OkErrorResponse } from "shared";
import { placeBid } from "../gameLogic";
import type { HandlerContext } from "./types";

export function placeBidHandler({
  socket,
  games,
  playerToGame,
  broadcast,
}: HandlerContext) {
  return (payload: PlaceBidPayload, callback?: (r: OkErrorResponse) => void) => {
    const game = games.get(payload?.gameId) ?? null;
    if (!game) {
      callback?.({ ok: false, error: "Game not found" });
      return;
    }
    if (playerToGame.get(socket.id) !== game.id) {
      callback?.({ ok: false, error: "Not in this game" });
      return;
    }
    const result = placeBid(game, payload.playerId, Number(payload?.bid));
    if (!result.ok) {
      callback?.({ ok: false, error: result.error });
      return;
    }
    broadcast(game);
    games.save();
    callback?.({ ok: true });
  };
}
