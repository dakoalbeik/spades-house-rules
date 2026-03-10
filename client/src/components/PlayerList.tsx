import type { PlayerId } from "shared";
import type { GameState } from "../types";
import "./PlayerList.css";

interface PlayerListProps {
  game: GameState;
  canKick?: boolean;
  onKick?: (playerId: PlayerId) => void;
}

const AVATAR_PALETTE = [
  "#1d4ed8", "#0f766e", "#7e22ce",
  "#b45309", "#be123c", "#0369a1",
  "#15803d", "#b91c1c",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export default function PlayerList({ game, canKick, onKick }: PlayerListProps) {
  const emptySlots = Math.max(0, game.options.maxPlayers - game.players.length);

  return (
    <div className="player-list">
      <div className="player-list-header">
        <span className="player-list-count">
          {game.players.length} / {game.options.maxPlayers} players
        </span>
        {game.phase === "lobby" && game.players.length < game.options.maxPlayers && (
          <span className="player-list-waiting">Waiting for players…</span>
        )}
      </div>

      <div className="player-grid">
        {game.players.map((p) => (
          <div
            key={p.playerId}
            className={`player-slot${p.isSelf ? " self" : ""}${p.isHost ? " host" : ""}`}
          >
            <div
              className="player-avatar"
              style={{ background: avatarColor(p.name) }}
            >
              {p.name.trim()[0]?.toUpperCase() ?? "?"}
            </div>

            <div className="player-info">
              <span className="player-name">{p.name}</span>
              <div className="player-badges">
                {p.isHost && <span className="badge badge-host">Host</span>}
                {p.isSelf && <span className="badge badge-you">You</span>}
                {p.status === "left" && <span className="badge badge-left">Left</span>}
              </div>
            </div>

            {canKick && onKick && !p.isHost && !p.isSelf && p.status !== "left" && (
              <button
                className="kick-btn"
                title={`Kick ${p.name}`}
                onClick={() => onKick(p.playerId)}
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {Array.from({ length: emptySlots }, (_, i) => (
          <div key={`empty-${i}`} className="player-slot empty">
            <div className="player-avatar-empty">?</div>
            <span className="player-name-empty">Open slot</span>
          </div>
        ))}
      </div>
    </div>
  );
}
