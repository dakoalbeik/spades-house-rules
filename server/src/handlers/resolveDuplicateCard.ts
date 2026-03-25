import type { ResolveDuplicateCardPayload, OkErrorResponse } from "shared";
import { resolveDuplicateCard, prepareTrickResolution, finalizeTrick } from "../gameLogic";
import type { HandlerContext } from "./types";

const TRICK_DISPLAY_DELAY_MS = 2000;

export function resolveDuplicateCardHandler({
  socket,
  games,
  broadcast,
}: HandlerContext) {
  return async (
    payload: ResolveDuplicateCardPayload,
    callback?: (r: OkErrorResponse) => void,
  ) => {
    const game = games.get(payload?.gameId) ?? null;
    if (!game) {
      callback?.({ ok: false, error: "Game not found" });
      return;
    }

    const result = resolveDuplicateCard(game, socket.id, payload.choice);
    if (!result.ok) {
      callback?.({ ok: false, error: result.error });
      return;
    }

    // Broadcast immediately so the overlay disappears and the next player can act
    broadcast(game);
    games.save();
    callback?.({ ok: true });

    // If the trick was already complete (duplicate was the last card played),
    // finalize it now: prepare resolution first so clients can animate
    if (result.trickComplete) {
      prepareTrickResolution(game);
      broadcast(game); // clients see trickResolution → animate cards toward winner
      games.save();
      await new Promise<void>((r) => setTimeout(r, TRICK_DISPLAY_DELAY_MS));
      finalizeTrick(game);
      broadcast(game);
      games.save();
    }
  };
}
