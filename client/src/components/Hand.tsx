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

export default function Hand({ game, isMyTurn, onPlayCard, canPlay }: HandProps) {
  const sortedHand = sortCards(game.hand);

  return (
    <div className="panel inner">
      <div className="row spaced">
        <h4>Your hand ({game.hand.length})</h4>
        {isMyTurn ? <span className="pill turn">Your turn</span> : null}
      </div>
      <div className="hand">
        {game.hand.length === 0 ? (
          <p className="muted">No cards in hand.</p>
        ) : (
          sortedHand.map((card) => (
            <Card
              key={card.id}
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

