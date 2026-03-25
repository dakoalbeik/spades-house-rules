import type { RequestStatePayload, SocketId } from "shared";
import { serializeGame } from "../gameLogic";
import type { HandlerContext } from "./types";

export function requestStateHandler({
  socket,
  games,
  connections,
}: HandlerContext) {
  return (payload: RequestStatePayload) => {
    const game = games.get(payload?.gameId) ?? null;
    if (!game) return;
    const playerId = connections.getPlayerForSocket(socket.id);
    if (!playerId) return;
    socket.emit("gameState", serializeGame(game, playerId));
  };
}
