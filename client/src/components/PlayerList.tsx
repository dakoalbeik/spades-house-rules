import type { GameState } from "../types";
import "./PlayerList.css";

interface PlayerListProps {
  game: GameState;
}

export default function PlayerList({ game }: PlayerListProps) {
  return (
    <div className="players">
      {game.players.map((p) => (
        <div
          key={p.id}
          className={`player ${p.isSelf ? "self" : ""} ${
            p.isHost ? "host" : ""
          }`}
        >
          <div className="row spaced">
            <div>
              <strong>{p.name}</strong>
              {p.isHost ? <span className="pill host-badge">Host</span> : null}
            </div>
            <span className="muted">{p.cardCount} cards</span>
          </div>
          <div className="row details">
            <span>Score: {p.score}</span>
            <span>Bid: {p.bid ?? "-"}</span>
            <span>Tricks: {p.tricks}</span>
          </div>
          {game.phase === "bidding" && game.currentTurnPlayerId === p.id ? (
            <span className="pill turn">Bidding</span>
          ) : null}
          {game.phase === "playing" && game.currentTurnPlayerId === p.id ? (
            <span className="pill turn">Playing</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
