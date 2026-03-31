import type { CardId } from "shared/dist/game";
import type { GameState } from "../types";
import Card from "./Card";
import "./Hand.css";

interface HandProps {
  game: GameState;
  isMyTurn: boolean;
  onPlayCard: (cardId: CardId) => void;
  canPlay: (cardId: CardId) => boolean;
}

export default function Hand({
  game,
  isMyTurn,
  onPlayCard,
  canPlay,
}: HandProps) {
  const sortedHand = game.hand;
  const count = sortedHand.length;

  const isLandscapeMobile = window.innerWidth > window.innerHeight && window.innerHeight < 500;
  const isMobile = window.innerWidth < 600;
  const isSmall = isMobile || isLandscapeMobile;
  const CARD_W = isLandscapeMobile ? 44 : isSmall ? 72 : 96;
  const OFFSET = isLandscapeMobile ? 20 : isSmall ? 26 : 36;
  const cardSize = isSmall ? "small" : "medium";

  const handWidth = count > 0 ? (count - 1) * OFFSET + CARD_W : CARD_W;

  return (
    <div className="hand-outer">
      <span
        className="pill turn hand-turn-pill"
        style={{ visibility: isMyTurn ? "visible" : "hidden" }}
      >
        Your turn
      </span>
      <div className="hand" style={{ width: handWidth + "px" }}>
        {sortedHand.map((card, index) => (
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
              size={cardSize}
              onClick={() => onPlayCard(card.id)}
              disabled={!canPlay(card.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
