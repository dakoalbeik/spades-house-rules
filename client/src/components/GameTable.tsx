import type { GameState, PublicPlayer } from "../types";
import OpponentFan from "./OpponentFan";
import TrickPile from "./TrickPile";
import "./GameTable.css";

type Area = "top" | "bot" | "left" | "right" | "center";

interface GameTableProps {
  game: GameState;
  myPlayer: PublicPlayer | undefined;
}

function getPositions(count: number): ("top" | "left" | "right")[] {
  if (count === 1) return ["top"];
  if (count === 2) return ["left", "right"];
  return ["left", "top", "right"];
}

export default function GameTable({ game, myPlayer }: GameTableProps) {
  const players = game.players;
  const isPlaying = game.phase === "playing";
  const trick = game.currentTrick;

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

  const opponents = players.slice(1);
  const positions = getPositions(opponents.length);

  // Map seat index to a position area for the trick pile
  const seatToArea = (seatIndex: number): Area => {
    if (seatIndex === 0) return "bot";
    const pos = positions[seatIndex - 1];
    if (pos === "top") return "top";
    if (pos === "left") return "left";
    if (pos === "right") return "right";
    return "center"; // fallback for 5+ players beyond known positions
  };

  return (
    <div className="game-table">
      <div className="table-surface">
        {/* Opponents */}
        {opponents.map((opp, i) => {
          const position = positions[i];
          const seatIndex = i + 1;
          const isActive = seatIndex === currentTurnSeat;

          return (
            <div
              key={opp.playerId}
              className={`table-seat table-seat-${position} ${isActive ? "current-turn" : ""}`}
            >
              {/* Right: fan first (toward center), label outer */}
              {position === "right" && (
                <div className="seat-fan-wrap">
                  <OpponentFan cardCount={opp.cardCount} position={position} />
                </div>
              )}

              <div className="seat-label">
                <span className="seat-name">{opp.name}</span>
                {opp.bid != null && (
                  <span className="seat-ratio">{opp.tricks}/{opp.bid}</span>
                )}
                {opp.isHost && <span className="host-badge">Host</span>}
                {opp.status === "left" && <span className="left-badge">Left</span>}
              </div>

              {/* Top / left: label outer, fan toward center */}
              {position !== "right" && (
                <div className="seat-fan-wrap">
                  <OpponentFan cardCount={opp.cardCount} position={position} />
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
            />
          )}
        </div>

        {/* Bottom seat (me) */}
        <div
          className={`table-seat table-seat-bottom ${0 === currentTurnSeat ? "current-turn" : ""}`}
        >
          {players[0] && (
            <div className="seat-label">
              <span className="seat-name">
                {players[0].name}
                {myPlayer?.playerId === players[0].playerId && (
                  <span className="you-label"> (You)</span>
                )}
              </span>
              {players[0].bid != null && (
                <span className="seat-ratio">{players[0].tricks}/{players[0].bid}</span>
              )}
              {players[0].isHost && <span className="host-badge">Host</span>}
              {players[0].status === "left" && <span className="left-badge">Left</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
