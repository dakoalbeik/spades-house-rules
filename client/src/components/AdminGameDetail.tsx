import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { adminFetch, clearAdminPassword } from "../utils/adminAuth";
import "./AdminDashboard.css";
import "./AdminGameDetail.css";

interface AdminPlayer {
  playerId: string;
  name: string;
  score: number;
  bid?: number;
  tricks: number;
  status: "active" | "left";
  isHost: boolean;
}

interface AdminGameDetail {
  id: string;
  phase: string;
  ongoing: boolean;
  roundNumber: number;
  options: { numDecks: number; maxPlayers: number; nilScore: number };
  createdAt: number;
  autoBid: boolean;
  autoPlay: boolean;
  currentTurnPlayerId: string | null;
  players: AdminPlayer[];
}

function phaseLabel(phase: string) {
  switch (phase) {
    case "lobby": return "Lobby";
    case "bidding": return "Bidding";
    case "playing": return "Playing";
    case "round_end": return "Round End";
    default: return phase;
  }
}

export default function AdminGameDetail() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<AdminGameDetail | null>(null);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState<"autoBid" | "autoPlay" | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleUnauthorized = useCallback(() => {
    clearAdminPassword();
    navigate("/admin/login", { replace: true });
  }, [navigate]);

  const fetchGame = useCallback(async () => {
    if (!gameId) return;
    try {
      const res = await adminFetch(`/games/${gameId}`);
      if (res.status === 401) { handleUnauthorized(); return; }
      if (res.status === 404) { setError("Game not found"); return; }
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to fetch game"); return; }
      setGame(data.game);
      setError("");
    } catch {
      setError("Could not reach server");
    }
  }, [gameId, handleUnauthorized]);

  useEffect(() => {
    fetchGame();
    pollRef.current = setInterval(fetchGame, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchGame]);

  const toggle = async (flag: "autoBid" | "autoPlay") => {
    if (!game || toggling) return;
    setToggling(flag);
    try {
      const res = await adminFetch(`/games/${gameId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [flag]: !game[flag] }),
      });
      if (res.status === 401) { handleUnauthorized(); return; }
      const data = await res.json();
      if (res.ok) setGame(data.game);
      else setError(data.error ?? "Failed to update settings");
    } catch {
      setError("Could not reach server");
    } finally {
      setToggling(null);
    }
  };

  if (error && !game) {
    return (
      <div className="admin-dashboard">
        <header className="admin-header">
          <div className="admin-header-left">
            <Link to="/admin" className="admin-back-link">← Games</Link>
            <h1>Game Detail</h1>
          </div>
        </header>
        <p className="admin-error admin-error-banner">{error}</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="admin-dashboard">
        <header className="admin-header">
          <div className="admin-header-left">
            <Link to="/admin" className="admin-back-link">← Games</Link>
            <h1>Loading…</h1>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-left">
          <Link to="/admin" className="admin-back-link">← Games</Link>
          <h1 className="admin-game-id">{game.id}</h1>
          <span className={`admin-phase-badge ${game.ongoing ? "phase-active" : "phase-lobby"}`}>
            {phaseLabel(game.phase)}
          </span>
          {game.ongoing && (
            <span className="admin-stat">Round {game.roundNumber}</span>
          )}
        </div>
        <button className="admin-refresh-btn" onClick={fetchGame}>Refresh</button>
      </header>

      {error && <p className="admin-error admin-error-banner">{error}</p>}

      {/* Auto-advance controls */}
      <section className="detail-section">
        <h2>Auto-advance</h2>
        <p className="detail-hint">
          When enabled the server acts for all players automatically, letting
          the game run on its own without any human input.
        </p>
        <div className="toggle-row">
          <button
            className={`toggle-btn ${game.autoBid ? "toggle-on" : "toggle-off"}`}
            onClick={() => toggle("autoBid")}
            disabled={toggling !== null}
          >
            <span className="toggle-indicator" />
            Auto-bid {game.autoBid ? "ON" : "OFF"}
          </button>
          <button
            className={`toggle-btn ${game.autoPlay ? "toggle-on" : "toggle-off"}`}
            onClick={() => toggle("autoPlay")}
            disabled={toggling !== null}
          >
            <span className="toggle-indicator" />
            Auto-play {game.autoPlay ? "ON" : "OFF"}
          </button>
        </div>
      </section>

      {/* Players */}
      <section className="detail-section">
        <h2>Players</h2>
        <ul className="admin-player-list detail-player-list">
          {game.players.map((p) => {
            const isCurrentTurn = p.playerId === game.currentTurnPlayerId;
            return (
              <li
                key={p.playerId}
                className={`admin-player ${p.status === "left" ? "player-left" : ""} ${isCurrentTurn ? "player-active-turn" : ""}`}
              >
                <span className="player-name">
                  {isCurrentTurn && <span className="turn-arrow">▶</span>}
                  {p.name}
                  {p.isHost && <span className="player-host-tag">host</span>}
                </span>
                <span className="player-meta">
                  {p.bid !== undefined && (
                    <span className="player-bid">bid {p.bid}</span>
                  )}
                  <span className="player-tricks">{p.tricks} tricks</span>
                  <span className="player-score">{p.score} pts</span>
                </span>
                {p.status === "left" && (
                  <span className="player-status-tag">disconnected</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
