import "./OpponentFan.css";

interface OpponentFanProps {
  cardCount: number;
  position: "top" | "left" | "right";
}

const MAX_VISIBLE = 13;

function spreadAngle(count: number): number {
  if (count <= 1) return 0;
  return Math.min(65, 12 + count * 4);
}

export default function OpponentFan({ cardCount, position }: OpponentFanProps) {
  const count = Math.min(cardCount, MAX_VISIBLE);
  const total = spreadAngle(count);
  const step = count > 1 ? total / (count - 1) : 0;
  const startAngle = -(total / 2);

  // Natural fan: pivot at bottom center, cards go up.
  // top  → rotate 180° so cards hang down toward table center
  // left → rotate 90°  so cards point right toward table center
  // right→ rotate -90° so cards point left toward table center
  const rotation =
    position === "top" ? 180 : position === "left" ? 90 : -90;

  return (
    <div
      className={`opp-fan opp-fan-${position}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="opp-fan-card"
          style={{ transform: `rotate(${startAngle + i * step}deg)` }}
        />
      ))}
    </div>
  );
}
