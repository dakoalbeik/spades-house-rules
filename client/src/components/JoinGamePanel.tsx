import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "shared";
import type { GameId, PlayerId } from "shared/dist/game";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface JoinGamePanelProps {
  socket: TypedSocket;
  gameId: GameId | "";
  playerName: string;
  onGameIdChange: (id: string) => void;
  onPlayerNameChange: (name: string) => void;
  onJoinedGame?: (gameId: GameId, playerId: PlayerId) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  isJoining: boolean;
  onJoiningChange: (joining: boolean) => void;
  isConnected: boolean;
}

export default function JoinGamePanel({
  socket,
  gameId,
  playerName,
  onGameIdChange,
  onPlayerNameChange,
  onJoinedGame,
  onError,
  onSuccess,
  isJoining,
  onJoiningChange,
  isConnected,
}: JoinGamePanelProps) {
  const handleJoin = () => {
    if (isJoining) return;
    const trimmedGameId = gameId.trim().toUpperCase();
    if (!trimmedGameId) {
      onError("Enter a game ID");
      return;
    }
    if (!playerName.trim()) {
      onError("Enter your name");
      return;
    }
    if (!isConnected) {
      onError("Not connected to server. Please wait...");
      return;
    }
    onJoiningChange(true);
    const validGameId = trimmedGameId as GameId;
    const timeout = setTimeout(() => {
      onJoiningChange(false);
      onError("Server did not respond. Is the server running?");
    }, 5000);
    socket.emit(
      "joinGame",
      { gameId: validGameId, playerName: playerName.trim() },
      (resp) => {
        clearTimeout(timeout);
        onJoiningChange(false);
        if (!resp) {
          onError("No response from server");
          return;
        }
        if (!resp.ok) {
          onError(resp.error || "Failed to join game");
        } else {
          onSuccess(`Joined game ${validGameId}!`);
          if (resp.gameId) {
            onGameIdChange(resp.gameId);
            if (resp.playerId) onJoinedGame?.(resp.gameId, resp.playerId);
          }
        }
      },
    );
  };

  return (
    <div className="lobby-panel">
      <h3 className="lobby-panel-title">
        <span className="panel-icon">⤵</span> Join game
      </h3>

      <label className="lobby-label">
        Game ID
        <input
          value={gameId}
          onChange={(e) => onGameIdChange(e.target.value.toUpperCase())}
          placeholder="e.g. ABC123"
          className="gameid-input"
        />
      </label>

      <label className="lobby-label">
        Your name
        <input
          value={playerName}
          onChange={(e) => onPlayerNameChange(e.target.value)}
          placeholder="Enter your name"
        />
      </label>

      <button
        className="lobby-btn join-btn"
        onClick={handleJoin}
        disabled={isJoining || !isConnected}
      >
        {isJoining ? "Joining…" : "Join game"}
      </button>
    </div>
  );
}
