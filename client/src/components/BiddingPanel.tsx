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
  if (game.phase !== "bidding" || !myPlayer) return null;

  // Only show the picker during this player's own bidding turn
  if (myPlayer.playerId !== game.currentTurnPlayerId) return null;

  const nilScore = game.options.nilScore ?? 100;

  return (
    <div className="bid-overlay">
      <div className="bid-modal">
        <div className="bid-modal-header">
          <span className="bid-modal-suit">♠</span>
          <span className="bid-modal-title">How many tricks?</span>
          <span className="bid-modal-suit">♠</span>
        </div>
        <div className="bid-options">
          <button
            className="bid-btn bid-nil"
            onClick={() => onBid(0)}
            title={`+${nilScore} if you take no tricks, −${nilScore} otherwise`}
          >
            Nil
          </button>
          {hand.map((card, index) => {
            const bid = index + 1;
            return (
              <button key={card.id} className="bid-btn" onClick={() => onBid(bid)}>
                {bid}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
