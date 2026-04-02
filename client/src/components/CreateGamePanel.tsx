import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "shared";
import type { GameId, PlayerId } from "shared/dist/game";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface CreateGamePanelProps {
  socket: TypedSocket;
  playerName: string;
  numDecks: number;
  maxPlayers: number;
  nilScore: number;
  onPlayerNameChange: (name: string) => void;
  onNumDecksChange: (decks: number) => void;
  onMaxPlayersChange: (players: number) => void;
  onNilScoreChange: (score: number) => void;
  onGameIdChange: (id: string) => void;
  onJoinedGame?: (gameId: GameId, playerId: PlayerId) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  isConnected: boolean;
}

export default function CreateGamePanel({
  socket,
  playerName,
  numDecks,
  maxPlayers,
  nilScore,
  onPlayerNameChange,
  onNumDecksChange,
  onMaxPlayersChange,
  onNilScoreChange,
  onGameIdChange,
  onJoinedGame,
  onError,
  onSuccess,
  isConnected,
}: CreateGamePanelProps) {
  const handleCreate = () => {
    if (!playerName.trim()) {
      onError("Enter your name");
      return;
    }
    if (!isConnected) {
      onError("Not connected to server. Please wait...");
      return;
    }
    socket.emit(
      "createGame",
      { playerName: playerName.trim(), numDecks, maxPlayers, nilScore },
      (resp) => {
        if (!resp) {
          onError("No response from server");
          return;
        }
        if (!resp.ok) {
          onError(resp.error || "Failed to create game");
          return;
        }
        if (resp.gameId) {
          onGameIdChange(resp.gameId);
          if (resp.playerId) onJoinedGame?.(resp.gameId, resp.playerId);
          onSuccess(`Game created! Share ID: ${resp.gameId}`);
        }
      },
    );
  };

  return (
    <div className="lobby-panel">
      <h3 className="lobby-panel-title">
        <span className="panel-icon">✦</span> New game
      </h3>

      <label className="lobby-label">
        Your name
        <input
          value={playerName}
          onChange={(e) => onPlayerNameChange(e.target.value)}
          placeholder="Enter your name"
        />
      </label>

      <div className="lobby-field">
        <span className="lobby-field-label">Decks</span>
        <div className="seg-ctrl">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              className={`seg-btn${numDecks === n ? " active" : ""}`}
              onClick={() => onNumDecksChange(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="lobby-field">
        <span className="lobby-field-label">Max players</span>
        <div className="seg-ctrl">
          {[2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              className={`seg-btn${maxPlayers === n ? " active" : ""}`}
              onClick={() => onMaxPlayersChange(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="lobby-field">
        <span className="lobby-field-label">Nil score</span>
        <div className="seg-ctrl">
          {[50, 100, 150, 200].map((n) => (
            <button
              key={n}
              className={`seg-btn${nilScore === n ? " active" : ""}`}
              onClick={() => onNilScoreChange(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <button
        className="lobby-btn"
        onClick={handleCreate}
        disabled={!isConnected}
      >
        Create lobby
      </button>
    </div>
  );
}
