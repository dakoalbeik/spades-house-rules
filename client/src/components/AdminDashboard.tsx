import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  adminFetch,
  clearAdminPassword,
} from "../utils/adminAuth";
import "./AdminDashboard.css";

interface AdminPlayer {
  name: string;
  score: number;
  status: "active" | "left";
  isHost: boolean;
}

interface AdminGame {
  id: string;
  phase: string;
  ongoing: boolean;
  roundNumber: number;
  options: { numDecks: number; maxPlayers: number; nilScore: number };
  createdAt: number;
  players: AdminPlayer[];
}

function phaseLabel(phase: string) {
  switch (phase) {
    case "lobby":
      return "Lobby";
    case "bidding":
      return "Bidding";
    case "playing":
      return "Playing";
    case "round_end":
      return "Round End";
    default:
      return phase;
  }
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString();
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [games, setGames] = useState<AdminGame[]>([]);
  const [fetchError, setFetchError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleUnauthorized = useCallback(() => {
    clearAdminPassword();
    navigate("/admin/login", { replace: true });
  }, [navigate]);

  const fetchGames = useCallback(async () => {
    try {
      const res = await adminFetch("/games");
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error ?? "Failed to fetch games");
        return;
      }
      setGames(
        [...data.games].sort(
          (a: AdminGame, b: AdminGame) => b.createdAt - a.createdAt,
        ),
      );
      setFetchError("");
    } catch {
      setFetchError("Could not reach server");
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    fetchGames();
    pollRef.current = setInterval(fetchGames, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchGames]);

  const handleDelete = async (gameId: string) => {
    setDeletingId(gameId);
    setConfirmDeleteId(null);
    try {
      const res = await adminFetch(`/games/${gameId}`, { method: "DELETE" });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error ?? "Delete failed");
      } else {
        setGames((prev) => prev.filter((g) => g.id !== gameId));
      }
    } catch {
      setFetchError("Could not reach server");
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    clearAdminPassword();
    navigate("/admin/login", { replace: true });
  };

  const ongoingCount = games.filter((g) => g.ongoing).length;
  const lobbyCount = games.length - ongoingCount;

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>Admin Dashboard</h1>
          <span className="admin-stat">
            {games.length} game{games.length !== 1 ? "s" : ""}
          </span>
          <span className="admin-badge admin-badge-ongoing">
            {ongoingCount} ongoing
          </span>
          <span className="admin-badge admin-badge-lobby">
            {lobbyCount} in lobby
          </span>
        </div>
        <div className="admin-header-right">
          <button className="admin-refresh-btn" onClick={fetchGames}>
            Refresh
          </button>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      {fetchError && (
        <p className="admin-error admin-error-banner">{fetchError}</p>
      )}

      {games.length === 0 ? (
        <p className="admin-empty">No games found.</p>
      ) : (
        <div className="admin-game-grid">
          {games.map((game) => (
            <div
              key={game.id}
              className={`admin-game-card ${game.ongoing ? "admin-game-ongoing" : ""}`}
            >
              <div className="admin-game-header">
                <span className="admin-game-id">{game.id}</span>
                <span
                  className={`admin-phase-badge ${game.ongoing ? "phase-active" : "phase-lobby"}`}
                >
                  {phaseLabel(game.phase)}
                </span>
              </div>

              <div className="admin-game-meta">
                <span>Round {game.roundNumber}</span>
                <span>
                  {game.players.length}/{game.options.maxPlayers} players
                </span>
                <span>
                  {game.options.numDecks} deck
                  {game.options.numDecks !== 1 ? "s" : ""}
                </span>
              </div>

              <ul className="admin-player-list">
                {game.players.map((p, i) => (
                  <li
                    key={i}
                    className={`admin-player ${p.status === "left" ? "player-left" : ""}`}
                  >
                    <span className="player-name">
                      {p.name}
                      {p.isHost && (
                        <span className="player-host-tag">host</span>
                      )}
                    </span>
                    <span className="player-score">{p.score} pts</span>
                    {p.status === "left" && (
                      <span className="player-status-tag">disconnected</span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="admin-game-footer">
                <Link to={`/admin/games/${game.id}`} className="admin-details-link">
                  Details
                </Link>
                <span className="admin-created-at">
                  Created {formatDate(game.createdAt)}
                </span>
                {confirmDeleteId === game.id ? (
                  <div className="admin-confirm-row">
                    <span>Delete this game?</span>
                    <button
                      className="admin-btn-danger"
                      onClick={() => handleDelete(game.id)}
                      disabled={deletingId === game.id}
                    >
                      {deletingId === game.id ? "Deleting…" : "Yes, delete"}
                    </button>
                    <button
                      className="admin-btn-cancel"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="admin-btn-danger"
                    onClick={() => setConfirmDeleteId(game.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
