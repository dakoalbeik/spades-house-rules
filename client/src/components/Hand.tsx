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

const OFFSET = 34;

export default function Hand({
  game,
  isMyTurn,
  onPlayCard,
  canPlay,
}: HandProps) {
  const sortedHand = sortCards(game.hand);

  return (
    <div className="panel inner">
      {isMyTurn ? <span className="pill turn">Your turn</span> : null}

      <div className="hand">
        {game.hand.length === 0 ? (
          <p className="muted">No cards in hand.</p>
        ) : (
          sortedHand.map((card, index) => (
            <Card
              key={card.id}
              style={{
                left: index * OFFSET + "px",
                zIndex: index,
                position: "absolute",
              }}
              card={card}
              onClick={() => onPlayCard(card.id)}
              disabled={!canPlay(card.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
