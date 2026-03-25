import type { StartGamePayload, OkErrorResponse, SocketId } from "shared";
import { startRound } from "../gameLogic";
import type { HandlerContext } from "./types";

export function startGameHandler({
  socket,
  games,
  connections,
  broadcast,
}: HandlerContext) {
  return (payload: StartGamePayload, callback?: (r: OkErrorResponse) => void) => {
    const game = games.get(payload?.gameId) ?? null;
    if (!game) {
      callback?.({ ok: false, error: "Game not found" });
      return;
    }
    const playerId = connections.getPlayerForSocket(socket.id as SocketId);
    const hostPlayer = playerId ? game.players.find((p) => p.playerId === playerId) : undefined;
    if (!hostPlayer?.isHost) {
      callback?.({ ok: false, error: "Only host can start" });
      return;
    }
    if (game.phase !== "lobby" && game.phase !== "round_end") {
      callback?.({ ok: false, error: "Game already in progress" });
      return;
    }
    const result = startRound(game);
    if (!result.ok) {
      callback?.({ ok: false, error: result.error });
      return;
    }
    broadcast(game);
    games.save();
    callback?.({ ok: true });
  };
}
