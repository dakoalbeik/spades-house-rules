import type { SocketId, PlayerId, GameId } from "shared";

/**
 * Bidirectional mapping between sockets, players, and games.
 *
 * A single player may have multiple active sockets (same user, multiple
 * tabs or devices). All socket→player lookups go through this registry so
 * that the rest of the codebase never has to reason about socket IDs directly.
 */
export class ConnectionRegistry {
  private readonly socketToPlayer = new Map<SocketId, PlayerId>();
  private readonly playerToSockets = new Map<PlayerId, Set<SocketId>>();
  private readonly playerToGame = new Map<PlayerId, GameId>();

  /** Register a socket as belonging to a player in a game. */
  register(socketId: SocketId, playerId: PlayerId, gameId: GameId): void {
    this.socketToPlayer.set(socketId, playerId);
    if (!this.playerToSockets.has(playerId)) {
      this.playerToSockets.set(playerId, new Set());
    }
    this.playerToSockets.get(playerId)!.add(socketId);
    this.playerToGame.set(playerId, gameId);
  }

  /**
   * Remove a single socket.
   * Returns the player it belonged to and how many sockets that player still has.
   * When remainingSockets reaches 0 the player→game mapping is also removed.
   */
  unregisterSocket(socketId: SocketId): {
    playerId: PlayerId | undefined;
    remainingSockets: number;
  } {
    const playerId = this.socketToPlayer.get(socketId);
    this.socketToPlayer.delete(socketId);
    if (!playerId) return { playerId: undefined, remainingSockets: 0 };

    const sockets = this.playerToSockets.get(playerId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.playerToSockets.delete(playerId);
        this.playerToGame.delete(playerId);
        return { playerId, remainingSockets: 0 };
      }
      return { playerId, remainingSockets: sockets.size };
    }
    this.playerToGame.delete(playerId);
    return { playerId, remainingSockets: 0 };
  }

  /**
   * Remove all sockets for a player (e.g. on kick or explicit game end).
   * Returns the set of socket IDs that were removed so the caller can
   * leave Socket.IO rooms and emit events.
   */
  unregisterPlayer(playerId: PlayerId): Set<SocketId> {
    const sockets = this.playerToSockets.get(playerId) ?? new Set<SocketId>();
    for (const socketId of sockets) {
      this.socketToPlayer.delete(socketId);
    }
    this.playerToSockets.delete(playerId);
    this.playerToGame.delete(playerId);
    return sockets;
  }

  getPlayerForSocket(socketId: SocketId): PlayerId | undefined {
    return this.socketToPlayer.get(socketId);
  }

  getSocketsForPlayer(playerId: PlayerId): ReadonlySet<SocketId> {
    return this.playerToSockets.get(playerId) ?? new Set<SocketId>();
  }

  getGameForPlayer(playerId: PlayerId): GameId | undefined {
    return this.playerToGame.get(playerId);
  }

  isSocketInGame(socketId: SocketId, gameId: GameId): boolean {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return false;
    return this.playerToGame.get(playerId) === gameId;
  }
}
