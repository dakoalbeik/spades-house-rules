import type { PlayCardPayload, OkErrorResponse } from "shared";
import { playCard, prepareTrickResolution, finalizeTrick } from "../gameLogic";
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

    // Only finalize when the trick is complete AND no duplicate choice is pending.
    // If pendingDuplicateChoice is set (mid-trick or last-card duplicate), the game
    // is paused — resolveDuplicateCardHandler will call finalizeTrick after the choice.
    if (result.trickComplete && !result.pendingDuplicateChoice) {
      prepareTrickResolution(game);
      broadcast(game); // clients see trickResolution → animate cards toward winner
      persistGames();
      await new Promise<void>((r) => setTimeout(r, TRICK_DISPLAY_DELAY_MS));
      finalizeTrick(game);
      broadcast(game);
      persistGames();
    }
  };
}
