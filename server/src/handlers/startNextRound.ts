import type { StartNextRoundPayload, OkErrorResponse, SocketId } from "shared";
import { startNextRound } from "../gameLogic";
import type { HandlerContext } from "./types";

export function startNextRoundHandler({
  socket,
  games,
  connections,
  broadcast,
}: HandlerContext) {
  return (payload: StartNextRoundPayload, callback?: (r: OkErrorResponse) => void) => {
    const game = games.get(payload?.gameId) ?? null;
    if (!game) {
      callback?.({ ok: false, error: "Game not found" });
      return;
    }
    const playerId = connections.getPlayerForSocket(socket.id as SocketId);
    const hostPlayer = playerId ? game.players.find((p) => p.playerId === playerId) : undefined;
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
