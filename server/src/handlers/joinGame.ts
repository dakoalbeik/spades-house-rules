import type { JoinGamePayload, GameResponse, SocketId } from "shared";
import { newPlayerId } from "../gameLogic";
import type { HandlerContext } from "./types";

export function joinGameHandler({
  socket,
  games,
  connections,
  broadcast,
}: HandlerContext) {
  return (payload: JoinGamePayload, callback?: (r: GameResponse) => void) => {
    const gameIdUpper = payload?.gameId?.trim().toUpperCase();
    if (!gameIdUpper) {
      callback?.({ ok: false, error: "Game ID is required" });
      return;
    }

    // eslint-disable-next-line no-console
    console.log(
      `Join attempt: ${socket.id} trying to join game ${gameIdUpper}`,
    );

    const game = games.get(gameIdUpper) ?? null;
    if (!game) {
      // eslint-disable-next-line no-console
      console.log(`Game ${gameIdUpper} not found`);
      callback?.({ ok: false, error: `Game "${gameIdUpper}" not found` });
      return;
    }

    const existingPlayerId = connections.getPlayerForSocket(socket.id);
    const alreadyInGame = existingPlayerId
      ? game.players.find((p) => p.playerId === existingPlayerId)
      : undefined;
    if (alreadyInGame) {
      // eslint-disable-next-line no-console
      console.log(`Player ${socket.id} already in game ${gameIdUpper}`);
      broadcast(game);
      callback?.({
        ok: true,
        gameId: game.id,
        playerId: alreadyInGame.playerId,
      });
      return;
    }

    const name = (payload?.playerName ?? "Player").trim() || "Player";
    const rejoinPlayerId = payload?.playerId?.trim();

    if (game.phase !== "lobby") {
      const slot =
        (rejoinPlayerId &&
          game.players.find((p) => p.playerId === rejoinPlayerId)) ||
        game.players.find((p) => p.name === name);
      if (!slot) {
        callback?.({
          ok: false,
          error: rejoinPlayerId
            ? "No player in this game with that session. Re-enter the game ID and your name to rejoin."
            : "No player with that name in this game",
        });
        return;
      }

      slot.id = socket.id;
      slot.status = "active";
      connections.register(socket.id, slot.playerId, game.id);
      socket.join(game.id);
      // eslint-disable-next-line no-console
      console.log(
        `Player ${socket.id} (${slot.name}) rejoined game ${game.id}`,
      );
      broadcast(game);
      games.save();
      callback?.({ ok: true, gameId: game.id, playerId: slot.playerId });
      return;
    }

    if (game.players.length >= game.options.maxPlayers) {
      callback?.({ ok: false, error: "Game is full" });
      return;
    }

    const stablePlayerId = newPlayerId();
    game.players.push({
      id: socket.id,
      playerId: stablePlayerId,
      name,
      hand: [],
      tricks: 0,
      score: 0,
      isHost: false,
      status: "active",
    });
    connections.register(socket.id, stablePlayerId, game.id);
    socket.join(game.id);

    // eslint-disable-next-line no-console
    console.log(
      `Player ${socket.id} (${name}) joined game ${game.id}. Total players: ${game.players.length}`,
    );

    broadcast(game);
    games.save();
    callback?.({ ok: true, gameId: game.id, playerId: stablePlayerId });
  };
}
