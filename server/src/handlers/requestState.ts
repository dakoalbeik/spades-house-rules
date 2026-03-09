import type { RequestStatePayload } from "shared";
import { serializeGame } from "../gameLogic";
import type { HandlerContext } from "./types";

export function requestStateHandler({ socket, games }: HandlerContext) {
  return (payload: RequestStatePayload) => {
    const game = games.get(payload?.gameId) ?? null;
    if (!game) return;
    socket.emit("gameState", serializeGame(game, socket.id));
  };
}
