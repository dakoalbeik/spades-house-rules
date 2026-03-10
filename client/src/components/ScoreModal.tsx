import type { GameState } from "../types";
import "./ScoreModal.css";

interface ScoreModalProps {
  game: GameState;
  onClose: () => void;
}

export default function ScoreModal({ game, onClose }: ScoreModalProps) {
  return (
    <div
      className="score-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="score-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Scorecard"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="score-modal-header">
          <span className="score-modal-title">Scorecard</span>
          <span className="score-modal-round">Round {game.roundNumber}</span>
          <button className="score-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <table className="score-table">
          <thead>
            <tr>
              <th className="col-name">Player</th>
              <th className="col-num">Bid</th>
              <th className="col-num">Tricks</th>
              <th className="col-num">Score</th>
            </tr>
          </thead>
          <tbody>
            {game.players.map((p) => (
              <tr key={p.playerId} className={p.isSelf ? "row-self" : ""}>
                <td className="col-name">
                  {p.name}
                  {p.isSelf && <span className="you-chip">You</span>}
                  {p.isHost && <span className="host-chip">Host</span>}
                  {p.status === "left" && <span className="left-chip">Left</span>}
                </td>
                <td className="col-num">{p.bid ?? "—"}</td>
                <td className="col-num">{p.tricks}</td>
                <td className="col-num score-value">{p.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
