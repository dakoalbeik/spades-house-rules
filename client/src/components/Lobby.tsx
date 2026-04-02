import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "shared";
import "./Lobby.css";
import type { GameId, PlayerId } from "shared/dist/game";
import CreateGamePanel from "./CreateGamePanel";
import JoinGamePanel from "./JoinGamePanel";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface LobbyProps {
  socket: TypedSocket;
  gameId: GameId | "";
  playerName: string;
  numDecks: number;
  maxPlayers: number;
  nilScore: number;
  onGameIdChange: (id: string) => void;
  onJoinedGame?: (gameId: GameId, playerId: PlayerId) => void;
  onPlayerNameChange: (name: string) => void;
  onNumDecksChange: (decks: number) => void;
  onMaxPlayersChange: (players: number) => void;
  onNilScoreChange: (score: number) => void;
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
  nilScore,
  onGameIdChange,
  onJoinedGame,
  onPlayerNameChange,
  onNumDecksChange,
  onMaxPlayersChange,
  onNilScoreChange,
  onError,
  onSuccess,
  isJoining,
  onJoiningChange,
  isConnected,
}: LobbyProps) {
  return (
    <section className="lobby">
      {/* Hero */}
      <div className="lobby-hero">
        <div className="lobby-suits">
          <span>♠</span>
          <span>♥</span>
          <span>♦</span>
          <span>♣</span>
        </div>
        <p className="lobby-tagline">
          Real-time multiplayer · Bid · Bluff · Win
        </p>
      </div>

      {/* Panels */}
      <div className="lobby-panels">
        <CreateGamePanel
          socket={socket}
          playerName={playerName}
          numDecks={numDecks}
          maxPlayers={maxPlayers}
          nilScore={nilScore}
          onPlayerNameChange={onPlayerNameChange}
          onNumDecksChange={onNumDecksChange}
          onMaxPlayersChange={onMaxPlayersChange}
          onNilScoreChange={onNilScoreChange}
          onGameIdChange={onGameIdChange}
          onJoinedGame={onJoinedGame}
          onError={onError}
          onSuccess={onSuccess}
          isConnected={isConnected}
        />

        <div className="lobby-divider">
          <span>or</span>
        </div>

        <JoinGamePanel
          socket={socket}
          gameId={gameId}
          playerName={playerName}
          onGameIdChange={onGameIdChange}
          onPlayerNameChange={onPlayerNameChange}
          onJoinedGame={onJoinedGame}
          onError={onError}
          onSuccess={onSuccess}
          isJoining={isJoining}
          onJoiningChange={onJoiningChange}
          isConnected={isConnected}
        />
      </div>
    </section>
  );
}
