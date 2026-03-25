import { cancelRound } from "../gameLogic";
import type { OkErrorResponse, SocketId } from "shared";
import type { HandlerContext } from "./types";

export function cancelRoundHandler({
  socket,
  games,
  connections,
  broadcast,
}: HandlerContext) {
  return (
    payload: { gameId: string },
    callback?: (r: OkErrorResponse) => void,
  ) => {
    const gameId = payload?.gameId?.trim().toUpperCase();
    const game = games.get(gameId);
    if (!game) {
      callback?.({ ok: false, error: "Game not found" });
      return;
    }

    const playerId = connections.getPlayerForSocket(socket.id as SocketId);
    const player = playerId ? game.players.find((p) => p.playerId === playerId) : undefined;
    if (!player?.isHost) {
      callback?.({ ok: false, error: "Only the host can dismiss a round" });
      return;
    }

    const result = cancelRound(game);
    if (!result.ok) {
      callback?.({ ok: false, error: result.error });
      return;
    }

    games.save();
    broadcast(game);
    callback?.({ ok: true });
  };
}
