import "./Header.css";

interface HeaderProps {
  status: string;
  playerName: string;
  gameId: string | null;
  isIngame?: boolean;
}

export default function Header({ status, playerName, gameId, isIngame }: HeaderProps) {
  if (isIngame) {
    return (
      <header className="header header-ingame">
        <div className="status">
          <span className={`pill pill-sm ${status === "Connected" ? "ok" : "warn"}`}>
            {status}
          </span>
          <span className="pill pill-sm">You: {playerName || "unnamed"}</span>
          {gameId ? <span className="pill pill-sm">Game: {gameId}</span> : null}
        </div>
      </header>
    );
  }

  return (
    <header className="header">
      <div>
        <h1>Spades Multiplayer</h1>
        <p className="muted">Create a lobby, bid, and play tricks in real time.</p>
      </div>
      <div className="status">
        <span className={`pill ${status === "Connected" ? "ok" : "warn"}`}>
          {status}
        </span>
        <span className="pill">You: {playerName || "unnamed"}</span>
        {gameId ? <span className="pill">Game: {gameId}</span> : null}
      </div>
    </header>
  );
}

