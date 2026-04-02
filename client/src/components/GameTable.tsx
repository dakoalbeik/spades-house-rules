import { useEffect, useState } from "react";
import type { ChatBubble, GameState } from "../types";
import TrickPile from "./TrickPile";
import { avatarColor } from "../utils/avatarColor";
import "./GameTable.css";

type Area = "top" | "bot" | "left" | "right" | "center";

interface GameTableProps {
  game: GameState;
}

const ORBIT_RADIUS = 150; // Distance from center in pixels
const MAX_SEATS = 10; // Maximum number of seats around the table

interface SeatPosition {
  x: number;
  y: number;
  angle: number;
}

function calculateSeatPosition(
  seatIndex: number,
  totalSeats: number,
): SeatPosition {
  // Distribute all players around full circle, with player 0 always at bottom
  // angle = π/2 is down (positive y), then go clockwise for other players
  const angle = Math.PI / 2 - (seatIndex / totalSeats) * 2 * Math.PI;
  const x = ORBIT_RADIUS * Math.cos(angle);
  const y = ORBIT_RADIUS * Math.sin(angle);

  return { x, y, angle };
}

function SeatRatio({
  phase,
  bid,
  tricks,
}: {
  phase: string;
  bid: number | undefined;
  tricks: number;
}) {
  if (bid == null) return null;
  if (phase === "bidding") return <span className="seat-ratio">bid {bid}</span>;
  return (
    <span className="seat-ratio">
      {tricks}/{bid}
    </span>
  );
}

/** Tracks which bubbles are currently visible, hiding timed ones when they expire. */
function useChatBubbles(incoming: Record<string, ChatBubble> | undefined) {
  const [visible, setVisible] = useState<Record<string, ChatBubble>>({});

  useEffect(() => {
    const now = Date.now();
    const next: Record<string, ChatBubble> = {};
    for (const [pid, bubble] of Object.entries(incoming ?? {})) {
      if (bubble.clearOn === "trick_end" || (bubble.clearOn as number) > now) {
        next[pid] = bubble;
      }
    }
    setVisible(next);

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const [pid, bubble] of Object.entries(next)) {
      if (typeof bubble.clearOn === "number") {
        const delay = (bubble.clearOn as number) - now;
        timers.push(
          setTimeout(
            () =>
              setVisible((prev) => {
                const copy = { ...prev };
                delete copy[pid];
                return copy;
              }),
            delay,
          ),
        );
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [incoming]);

  return visible;
}

export default function GameTable({ game }: GameTableProps) {
  const players = [game.player, ...game.opponents];
  const isPlaying = game.phase === "playing";
  const trick = game.currentTrick;
  const totalPlayers = Math.min(players.length, MAX_SEATS);

  const playsBySeat: (NonNullable<typeof trick>["plays"][number] | null)[] =
    new Array(players.length).fill(null);
  if (trick?.plays) {
    for (const play of trick.plays) {
      const seat = players.findIndex((p) => p.playerId === play.playerId);
      if (seat >= 0) playsBySeat[seat] = play;
    }
  }

  const currentTurnSeat = players.findIndex(
    (p) => p.playerId === game.currentTurnPlayerId,
  );

  const bubbles = useChatBubbles(game.chatBubbles);

  // Map seat index to a position area for the trick pile
  const seatToArea = (seatIndex: number): Area => {
    if (seatIndex === 0) return "bot";

    const position = calculateSeatPosition(seatIndex, totalPlayers);
    const angleDeg = (position.angle * 180) / Math.PI;

    // Approximate which side based on angle
    if (angleDeg < -45) return "left";
    if (angleDeg < 45) return "top";
    if (angleDeg < 135) return "right";
    return "bot";
  };

  const playerSeat = calculateSeatPosition(0, totalPlayers);
  const playerIsActive = currentTurnSeat === 0;
  const playerIsHost = game.player.isHost;
  const playerStatus = game.player.status;

  return (
    <div className="game-table">
      <div className="table-surface">
        {/* Own player seat (always at bottom) */}
        <div
          className={`table-seat${playerIsActive ? " current-turn" : ""}`}
          style={{
            left: `calc(50% + ${playerSeat.x}px)`,
            top: `calc(50% + ${playerSeat.y}px)`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="seat-label">
            <div
              className="seat-avatar"
              style={{ background: avatarColor(game.player.name) }}
            >
              {game.player.name.trim()[0]?.toUpperCase() ?? "?"}
            </div>
            <span className="seat-name">
              {game.player.name}
              <span className="you-label"> (You)</span>
            </span>
            <SeatRatio
              phase={game.phase}
              bid={game.player.bid}
              tricks={game.player.tricks}
            />
            {playerIsHost && <span className="host-badge">Host</span>}
            {playerStatus === "left" && (
              <span className="left-badge">Left</span>
            )}
          </div>

          {bubbles[game.player.playerId] && (
            <div
              className="chat-bubble"
              key={bubbles[game.player.playerId]!.message}
            >
              {bubbles[game.player.playerId]!.message}
            </div>
          )}
        </div>

        {/* Opponent player seats */}
        {game.opponents.map((player, opponentIndex) => {
          const seatIndex = opponentIndex + 1;
          if (seatIndex >= totalPlayers) return null;

          const seatPos = calculateSeatPosition(seatIndex, totalPlayers);
          const isActive = seatIndex === currentTurnSeat;

          return (
            <div
              key={player.playerId}
              className={`table-seat ${isActive ? "current-turn" : ""}`}
              style={{
                left: `calc(50% + ${seatPos.x}px)`,
                top: `calc(50% + ${seatPos.y}px)`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="seat-label">
                <div
                  className="seat-avatar"
                  style={{ background: avatarColor(player.name) }}
                >
                  {player.name.trim()[0]?.toUpperCase() ?? "?"}
                </div>
                <span className="seat-name">{player.name}</span>
                <SeatRatio
                  phase={game.phase}
                  bid={player.bid}
                  tricks={player.tricks}
                />
                {player.isHost && <span className="host-badge">Host</span>}
                {player.status === "left" && (
                  <span className="left-badge">Left</span>
                )}
              </div>

              {bubbles[player.playerId] && (
                <div
                  className="chat-bubble"
                  key={bubbles[player.playerId]!.message}
                >
                  {bubbles[player.playerId]!.message}
                </div>
              )}
            </div>
          );
        })}

        {/* Center: trick cards */}
        <div className="table-center">
          {isPlaying && trick?.plays && trick.plays.length > 0 && (
            <TrickPile
              plays={trick.plays}
              players={players}
              seatToArea={seatToArea}
              winnerId={game.trickResolution?.winnerId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
