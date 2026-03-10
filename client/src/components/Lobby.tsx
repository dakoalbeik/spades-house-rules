import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "shared";
import "./Lobby.css";
import type { GameId, PlayerId } from "shared/dist/game";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface LobbyProps {
  socket: TypedSocket;
  gameId: GameId | "";
  playerName: string;
  numDecks: number;
  maxPlayers: number;
  onGameIdChange: (id: string) => void;
  onJoinedGame?: (gameId: GameId, playerId: PlayerId) => void;
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
    if (!playerName.trim()) { onError("Enter your name"); return; }
    if (!isConnected) { onError("Not connected to server. Please wait..."); return; }
    socket.emit(
      "createGame",
      { playerName: playerName.trim(), numDecks, maxPlayers },
      (resp) => {
        if (!resp) { onError("No response from server"); return; }
        if (!resp.ok) { onError(resp.error || "Failed to create game"); return; }
        if (resp.gameId) {
          onGameIdChange(resp.gameId);
          if (resp.playerId) onJoinedGame?.(resp.gameId, resp.playerId);
          onSuccess(`Game created! Share ID: ${resp.gameId}`);
        }
      },
    );
  };

  const handleJoin = () => {
    if (isJoining) return;
    const trimmedGameId = gameId.trim().toUpperCase();
    if (!trimmedGameId) { onError("Enter a game ID"); return; }
    if (!playerName.trim()) { onError("Enter your name"); return; }
    if (!isConnected) { onError("Not connected to server. Please wait..."); return; }
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
        if (!resp) { onError("No response from server"); return; }
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
    <section className="lobby">
      {/* Hero */}
      <div className="lobby-hero">
        <div className="lobby-suits">
          <span>♠</span><span>♥</span><span>♦</span><span>♣</span>
        </div>
        <p className="lobby-tagline">Real-time multiplayer · Bid · Bluff · Win</p>
      </div>

      {/* Panels */}
      <div className="lobby-panels">
        {/* Create */}
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

          <button className="lobby-btn" onClick={handleCreate} disabled={!isConnected}>
            Create lobby
          </button>
        </div>

        <div className="lobby-divider"><span>or</span></div>

        {/* Join */}
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
      </div>
    </section>
  );
}
