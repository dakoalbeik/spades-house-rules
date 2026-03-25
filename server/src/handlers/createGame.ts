import type { CreateGamePayload, GameResponse } from "shared";
import { createGame } from "../gameLogic";
import type { HandlerContext } from "./types";

export function createGameHandler({
  socket,
  games,
  playerToGame,
  broadcast,
  validateOptions,
}: HandlerContext) {
  return (payload: CreateGamePayload, callback?: (r: GameResponse) => void) => {
    const name = (payload?.playerName ?? "Host").trim() || "Host";
    const options = validateOptions({
      numDecks: payload?.numDecks,
      maxPlayers: payload?.maxPlayers,
    });

    let game = createGame(socket.id, name, options);
    while (games.has(game.id)) {
      game = createGame(socket.id, name, options);
    }
    games.set(game.id, game);
    playerToGame.set(socket.id, game.id);
    socket.join(game.id);
    broadcast(game);
    games.save();
    callback?.({
      ok: true,
      gameId: game.id,
      playerId: game.players[0].playerId,
    });
  };
}
