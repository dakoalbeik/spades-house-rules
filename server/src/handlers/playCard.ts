import type { PlayCardPayload, OkErrorResponse } from "shared";
import { playCard, finalizeTrick } from "../gameLogic";
import type { HandlerContext } from "./types";

const TRICK_DISPLAY_DELAY_MS = 2000;

export function playCardHandler({
  socket,
  games,
  broadcast,
  persistGames,
}: HandlerContext) {
  return async (payload: PlayCardPayload, callback?: (r: OkErrorResponse) => void) => {
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

    if (result.trickComplete) {
      await new Promise<void>((r) => setTimeout(r, TRICK_DISPLAY_DELAY_MS));
      finalizeTrick(game);
      broadcast(game);
      persistGames();
    }
  };
}
