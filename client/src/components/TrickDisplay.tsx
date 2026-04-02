import type { GameState } from "../types";
import Card from "./Card";
import "./TrickDisplay.css";

interface TrickDisplayProps {
  game: GameState;
}

export default function TrickDisplay({ game }: TrickDisplayProps) {
  if (game.phase !== "playing") {
    return null;
  }

  return (
    <div className="panel inner">
      <div className="row spaced">
        <h4>Current trick</h4>
        {game.currentTrick && game.currentTrick.plays.length === 0 ? (
          <span className="muted">Waiting for lead...</span>
        ) : null}
      </div>
      <div className="plays">
        {game.currentTrick?.plays.map((play) => {
          const player = [game.player, ...game.opponents].find(
            (p) => p.playerId === play.playerId,
          );
          return (
            <div key={play.card.id} className="play">
              <strong>{player?.name ?? "Player"}</strong>
              <Card card={play.card} size="small" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
