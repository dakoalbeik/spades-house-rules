import { useState } from "react";
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
  const [selectedBid, setSelectedBid] = useState<number | null>(null);

  if (game.phase !== "bidding" || !myPlayer) return null;

  // Only show the picker during this player's own bidding turn
  if (myPlayer.playerId !== game.currentTurnPlayerId) return null;

  const nilScore = game.options.nilScore ?? 100;
  const maxBid = Math.max(1, Math.ceil(hand.length / 2));
  const bids = Array.from({ length: maxBid }, (_, i) => i + 1);
  const mid = Math.floor(bids.length / 2);
  const row1 = bids.slice(0, mid);
  const row2 = bids.slice(mid);

  const handleConfirm = () => {
    if (selectedBid !== null) {
      onBid(selectedBid);
    }
  };

  return (
    <div className="bid-overlay">
      <div className="bid-modal">
        <div className="bid-modal-header">
          <span className="bid-modal-suit">♠</span>
          <span className="bid-modal-title">How many tricks?</span>
          <span className="bid-modal-suit">♠</span>
        </div>
        <div className="bid-numbers">
          <div className="bid-row">
            <button
              className={`bid-btn bid-nil ${selectedBid === 0 ? "bid-selected" : ""}`}
              onClick={() => setSelectedBid(0)}
              title={`+${nilScore} if you take no tricks, −${nilScore} otherwise`}
            >
              Nil
            </button>
            {row1.map((bid) => (
              <button
                key={bid}
                className={`bid-btn ${selectedBid === bid ? "bid-selected" : ""}`}
                onClick={() => setSelectedBid(bid)}
              >
                {bid}
              </button>
            ))}
          </div>
          {row2.length > 0 && (
            <div className="bid-row">
              {row2.map((bid) => (
                <button
                  key={bid}
                  className={`bid-btn ${selectedBid === bid ? "bid-selected" : ""}`}
                  onClick={() => setSelectedBid(bid)}
                >
                  {bid}
                </button>
              ))}
            </div>
          )}
          <button
            className="bid-confirm-btn"
            onClick={handleConfirm}
            disabled={selectedBid === null}
          >
            Bid{" "}
            {selectedBid !== null
              ? selectedBid === 0
                ? "Nil"
                : selectedBid
              : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
