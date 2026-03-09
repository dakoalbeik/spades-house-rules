import type { PlayCardPayload, OkErrorResponse } from "shared";
import { playCard } from "../gameLogic";
import type { HandlerContext } from "./types";

export function playCardHandler({
  socket,
  games,
  broadcast,
  persistGames,
}: HandlerContext) {
  return (payload: PlayCardPayload, callback?: (r: OkErrorResponse) => void) => {
    const game = games.get(payload?.gameId) ?? null;
    if (!game) {
      callback?.({ ok: false, error: "Game not found" });
      return;
    }
    const result = playCard(game, socket.id, payload.cardId);
    if (!result.ok) {
      callback?.({ ok: false, error: result.error });
      return;
    }
    broadcast(game);
    persistGames();
    callback?.({ ok: true });
  };
}
