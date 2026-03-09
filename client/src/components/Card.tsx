import type { Card as CardType } from "../types";
import { getCardImagePath, formatCard } from "../utils/cardUtils";
import "./Card.css";

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  style?: React.CSSProperties;
}

export default function Card({
  card,
  onClick,
  disabled,
  style,
  size = "medium",
}: CardProps) {
  const sizeClass = `card-image-${size}`;

  if (onClick) {
    return (
      <button
        style={style}
        className={`card-btn ${disabled ? "disabled" : ""}`}
        onClick={onClick}
        disabled={disabled}
        aria-label={formatCard(card)}
      >
        <img
          src={getCardImagePath(card)}
          alt={formatCard(card)}
          className={`card-image ${sizeClass}`}
        />
      </button>
    );
  }

  return (
    <div className="card-display">
      <img
        src={getCardImagePath(card)}
        alt={formatCard(card)}
        className={`card-image ${sizeClass}`}
      />
    </div>
  );
}
