import type { GameState } from "../types";
import { sortCards } from "../utils/cardUtils";
import Card from "./Card";
import "./Hand.css";

interface HandProps {
  game: GameState;
  isMyTurn: boolean;
  onPlayCard: (cardId: string) => void;
  canPlay: (cardId: string) => boolean;
}

const OFFSET = 36; // horizontal offset per card (px)

export default function Hand({
  game,
  isMyTurn,
  onPlayCard,
  canPlay,
}: HandProps) {
  const sortedHand = sortCards(game.hand);
  const count = sortedHand.length;
  const handWidth = count > 0 ? (count - 1) * OFFSET + 80 : 80;

  return (
    <div className="hand-outer">
      <span className="pill turn hand-turn-pill" style={{ visibility: isMyTurn ? "visible" : "hidden" }}>Your turn</span>
      <div className="hand" style={{ width: handWidth + "px" }}>
        {count === 0 ? (
          <p className="muted">No cards in hand.</p>
        ) : (
          sortedHand.map((card, index) => (
            <div
              key={card.id}
              className="hand-card-slot"
              style={{
                left: index * OFFSET + "px",
                zIndex: index,
              }}
            >
              <Card
                card={card}
                onClick={() => onPlayCard(card.id)}
                disabled={!canPlay(card.id)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
