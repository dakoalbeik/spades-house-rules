import type { PlayCardPayload, OkErrorResponse } from "shared";
import { playCard, prepareTrickResolution, finalizeTrick } from "../gameLogic";
import type { HandlerContext } from "./types";

const TRICK_DISPLAY_DELAY_MS = 2000;

export function playCardHandler({
  socket,
  games,
  playerToGame,
  broadcast,
}: HandlerContext) {
  return async (payload: PlayCardPayload, callback?: (r: OkErrorResponse) => void) => {
    const game = games.get(payload?.gameId) ?? null;
    if (!game) {
      callback?.({ ok: false, error: "Game not found" });
      return;
    }
    if (playerToGame.get(socket.id) !== game.id) {
      callback?.({ ok: false, error: "Not in this game" });
      return;
    }
    const result = playCard(game, payload.playerId, payload.cardId);
    if (!result.ok) {
      callback?.({ ok: false, error: result.error });
      return;
    }
    broadcast(game);
    games.save();
    callback?.({ ok: true });

    if (result.trickComplete && !result.pendingDuplicateChoice) {
      prepareTrickResolution(game);
      broadcast(game);
      games.save();
      await new Promise<void>((r) => setTimeout(r, TRICK_DISPLAY_DELAY_MS));
      finalizeTrick(game);
      broadcast(game);
      games.save();
    }
  };
}
