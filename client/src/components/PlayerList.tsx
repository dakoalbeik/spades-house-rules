import type { GameState } from "../types";
import "./PlayerList.css";

interface PlayerListProps {
  game: GameState;
  canKick?: boolean;
  onKick?: (playerId: string) => void;
}

export default function PlayerList({ game, canKick, onKick }: PlayerListProps) {
  return (
    <div className="players">
      {game.players.map((p) => (
        <div
          key={p.playerId}
          className={`player ${p.isSelf ? "self" : ""} ${
            p.isHost ? "host" : ""
          } ${p.status === "left" ? "left" : ""}`}
        >
          <div className="row spaced">
            <div>
              <strong>{p.name}</strong>
              {p.isHost ? <span className="pill host-badge">Host</span> : null}
              {p.status === "left" ? (
                <span className="pill left-badge">Left</span>
              ) : null}
            </div>
            <span className="muted">{p.cardCount} cards</span>
          </div>
          <div className="row details">
            <span>Score: {p.score}</span>
            <span>Bid: {p.bid ?? "-"}</span>
            <span>Tricks: {p.tricks}</span>
          </div>
          {game.phase === "bidding" &&
          game.currentTurnPlayerId === p.playerId ? (
            <span className="pill turn">Bidding</span>
          ) : null}
          {game.phase === "playing" &&
          game.currentTurnPlayerId === p.playerId ? (
            <span className="pill turn">Playing</span>
          ) : null}
          {canKick && onKick && !p.isHost && !p.isSelf && p.status !== "left" ? (
            <button
              type="button"
              className="kick-btn"
              onClick={() => onKick(p.playerId)}
            >
              Kick
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
