import type { Card, GameState, PublicPlayer } from "../types";
import "./BiddingPanel.css";

interface BiddingPanelProps {
  game: GameState;
  myPlayer: PublicPlayer | undefined;
  hand: Card[];
  onBid: (bid: number) => void;
}

export default function BiddingPanel({
  game,
  myPlayer,
  hand,
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
          {hand.map((card, index) => {
            const bid = index + 1;
            return (
              <button key={card.id} onClick={() => onBid(bid)}>
                {bid}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
