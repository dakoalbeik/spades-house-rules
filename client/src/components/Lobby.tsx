import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "shared";
import "./Lobby.css";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface LobbyProps {
  socket: TypedSocket;
  gameId: string;
  playerName: string;
  numDecks: number;
  maxPlayers: number;
  onGameIdChange: (id: string) => void;
  onJoinedGame?: (gameId: string, playerId: string) => void;
  onPlayerNameChange: (name: string) => void;
  onNumDecksChange: (decks: number) => void;
  onMaxPlayersChange: (players: number) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  isJoining: boolean;
  onJoiningChange: (joining: boolean) => void;
  isConnected: boolean;
}

export default function Lobby({
  socket,
  gameId,
  playerName,
  numDecks,
  maxPlayers,
  onGameIdChange,
  onJoinedGame,
  onPlayerNameChange,
  onNumDecksChange,
  onMaxPlayersChange,
  onError,
  onSuccess,
  isJoining,
  onJoiningChange,
  isConnected,
}: LobbyProps) {
  const handleCreate = () => {
    if (!playerName.trim()) {
      onError("Enter your name");
      return;
    }
    if (!isConnected) {
      onError("Not connected to server. Please wait...");
      return;
    }

    socket.emit("createGame", { playerName: playerName.trim(), numDecks, maxPlayers }, (resp) => {
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
      }
    );
  };

  const handleJoin = () => {
    if (isJoining) {
      return;
    }

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
    console.log("Attempting to join game:", trimmedGameId);

    const timeout = setTimeout(() => {
      console.error("Join game timeout - no response from server");
      onJoiningChange(false);
      onError("Server did not respond. Is the server running?");
    }, 5000);

    socket.emit("joinGame", { gameId: trimmedGameId, playerName: playerName.trim() }, (resp) => {
        clearTimeout(timeout);
        onJoiningChange(false);
        console.log("Join game response received:", resp);

        if (!resp) {
          onError("No response from server");
          return;
        }
        if (!resp.ok) {
          onError(resp.error || "Failed to join game");
        } else {
          onSuccess(`Successfully joined game ${trimmedGameId}!`);
          if (resp.gameId) {
            onGameIdChange(resp.gameId);
            if (resp.playerId) onJoinedGame?.(resp.gameId, resp.playerId);
          }
        }
      }
    );
  };

  return (
    <section className="panels">
      <div className="panel">
        <h3>Create game</h3>
        <label>
          Name
          <input
            value={playerName}
            onChange={(e) => onPlayerNameChange(e.target.value)}
            placeholder="Host name"
          />
        </label>
        <div className="two-col">
          <label>
            Decks
            <input
              type="number"
              min={1}
              max={3}
              value={numDecks}
              onChange={(e) => onNumDecksChange(Number(e.target.value))}
            />
          </label>
          <label>
            Players
            <input
              type="number"
              min={2}
              max={6}
              value={maxPlayers}
              onChange={(e) => onMaxPlayersChange(Number(e.target.value))}
            />
          </label>
        </div>
        <button onClick={handleCreate}>Create lobby</button>
      </div>

      <div className="panel">
        <h3>Join game</h3>
        <label>
          Game ID
          <input
            value={gameId}
            onChange={(e) => onGameIdChange(e.target.value.toUpperCase())}
            placeholder="ABC123"
          />
        </label>
        <label>
          Name
          <input
            value={playerName}
            onChange={(e) => onPlayerNameChange(e.target.value)}
            placeholder="Your name"
          />
        </label>
        <button onClick={handleJoin} disabled={isJoining || !isConnected}>
          {isJoining ? "Joining..." : "Join"}
        </button>
      </div>
    </section>
  );
}

