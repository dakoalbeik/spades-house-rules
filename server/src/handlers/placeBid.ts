import type { PlaceBidPayload, OkErrorResponse } from "shared";
import { placeBid } from "../gameLogic";
import type { HandlerContext } from "./types";

export function placeBidHandler({
  socket,
  games,
  broadcast,
  persistGames,
}: HandlerContext) {
  return (payload: PlaceBidPayload, callback?: (r: OkErrorResponse) => void) => {
    const game = games.get(payload?.gameId) ?? null;
    if (!game) {
      callback?.({ ok: false, error: "Game not found" });
      return;
    }
    const result = placeBid(game, socket.id, Number(payload?.bid));
    if (!result.ok) {
      callback?.({ ok: false, error: result.error });
      return;
    }
    broadcast(game);
    persistGames();
    callback?.({ ok: true });
  };
}
