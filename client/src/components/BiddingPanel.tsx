import type { GameState, PublicPlayer } from "../types";
import "./BiddingPanel.css";

interface BiddingPanelProps {
  game: GameState;
  myPlayer: PublicPlayer | undefined;
  bidInput: string;
  onBidInputChange: (bid: string) => void;
  onBid: () => void;
}

export default function BiddingPanel({
  game,
  myPlayer,
  bidInput,
  onBidInputChange,
  onBid,
}: BiddingPanelProps) {
  if (game.phase !== "bidding" || !myPlayer) {
    return null;
  }

  return (
    <div className="panel inner">
      <div className="row spaced">
        <div>
          <h4>Bidding</h4>
          <p className="muted">Bid how many tricks you expect to take.</p>
        </div>
        <div className="row gap">
          <input
            type="number"
            min={0}
            max={game.hand.length}
            value={bidInput}
            onChange={(e) => onBidInputChange(e.target.value)}
            disabled={game.currentTurnPlayerId !== myPlayer.id}
          />
          <button
            disabled={game.currentTurnPlayerId !== myPlayer.id}
            onClick={onBid}
          >
            Submit bid
          </button>
        </div>
      </div>
    </div>
  );
}
