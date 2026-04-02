import { useState } from "react";
import "./Header.css";

interface HeaderProps {
  status: string;
  playerName: string;
  gameId: string | null;
  isIngame?: boolean;
}

export default function Header({ status, playerName, gameId, isIngame }: HeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (!gameId) return;
    const url = `${window.location.origin}${window.location.pathname}?game=${gameId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const gameIdPill = gameId ? (
    <button
      className="pill pill-sm pill-btn"
      onClick={handleCopyLink}
      title="Copy invite link"
    >
      {copied ? "Copied!" : `Game: ${gameId}`}
    </button>
  ) : null;

  const gameIdPillLg = gameId ? (
    <button
      className="pill pill-btn"
      onClick={handleCopyLink}
      title="Copy invite link"
    >
      {copied ? "Copied!" : `Game: ${gameId}`}
    </button>
  ) : null;

  if (isIngame) {
    return (
      <header className="header header-ingame">
        <div className="status">
          <span className={`pill pill-sm ${status === "Connected" ? "ok" : "warn"}`}>
            {status}
          </span>
          <span className="pill pill-sm">You: {playerName || "unnamed"}</span>
          {gameIdPill}
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
        {gameIdPillLg}
      </div>
    </header>
  );
}

