import type { PlayerId } from "shared";
import type { GameState } from "../types";
import "./SeatSelection.css";

interface SeatSelectionProps {
  game: GameState;
  canKick?: boolean;
  onKick?: (playerId: PlayerId) => void;
  onSeatSelect?: (seatIndex: number) => void;
}

const ORBIT_RADIUS = 320; // Distance from center in pixels (outside table)

interface SeatPosition {
  x: number;
  y: number;
}

function calculateSeatPosition(
  seatIndex: number,
  totalSeats: number,
): SeatPosition {
  // Distribute seats around full circle, with seat 0 always at bottom
  const angle = Math.PI / 2 - (seatIndex / totalSeats) * 2 * Math.PI;
  const x = ORBIT_RADIUS * Math.cos(angle);
  const y = ORBIT_RADIUS * Math.sin(angle);
  return { x, y };
}

export default function SeatSelection({ game, onSeatSelect }: SeatSelectionProps) {
  const maxSeats = game.options.maxPlayers;

  // Create array of seat positions
  const seats = [];
  for (let i = 0; i < maxSeats; i++) {
    seats.push({
      index: i,
      position: calculateSeatPosition(i, maxSeats),
    });
  }

  return (
    <div className="seat-selection">
      <div className="table-container">
        <div className="table-surface">
          {/* Center circle */}
          <div className="table-center">
            <div className="center-circle"></div>
          </div>

          {/* Seat circles around the table */}
          {seats.map((seat) => (
            <button
              key={seat.index}
              className="seat-circle"
              style={{
                left: `calc(50% + ${seat.position.x}px)`,
                top: `calc(50% + ${seat.position.y}px)`,
              }}
              type="button"
              onClick={() => onSeatSelect?.(seat.index)}
            >
              {seat.index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
