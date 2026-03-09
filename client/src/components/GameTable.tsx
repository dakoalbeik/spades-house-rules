import type { GameState, PublicPlayer } from "../types";
import Card from "./Card";
import CardBack from "./CardBack";
import "./GameTable.css";

const MAX_BACKS_VISIBLE = 10;

interface GameTableProps {
  game: GameState;
  myPlayer: PublicPlayer | undefined;
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
  const isCurrentTurn = (seatIndex: number) => seatIndex === currentTurnSeat;

  const opponentPositions = ["left", "top", "right"];

  return (
    <div className="game-table">
      <div className="table-surface">
        {/* Opponents (top/left/right) */}
        {players.slice(1).map((seat, i) => {
          const position = opponentPositions[i] || "right";
          const metaVariant = position === "top" ? "full" : "compact";
          const spread = position === "top" ? "horizontal" : "vertical";
          const play = playsBySeat[i + 1];
          const seatClass = `table-seat table-seat-opponent table-seat-${position} ${isCurrentTurn(i + 1) ? "current-turn" : ""}`;
          const meta =
            seat && metaVariant === "compact" ? (
              <>
                {seat.score} · T: {seat.tricks}
                {seat.bid != null ? ` · B: ${seat.bid}` : ""}
              </>
            ) : seat ? (
              <>
                Score: {seat.score} · Tricks: {seat.tricks}
                {seat.bid != null ? ` · Bid: ${seat.bid}` : ""}
              </>
            ) : null;

          return (
            <div key={seat?.playerId || i} className={seatClass}>
              {isPlaying && play && (
                <div
                  className={`trick-slot trick-slot-at-seat trick-slot-${position}`}
                >
                  <Card card={play.card} size="small" />
                </div>
              )}
              {seat && (
                <>
                  <div className="table-seat-info">
                    <span className="table-seat-name">{seat.name}</span>
                    {seat.isHost && (
                      <span className="pill host-badge">Host</span>
                    )}
                    {seat.status === "left" && (
                      <span className="pill left-badge">Left</span>
                    )}
                  </div>
                  <div className="table-seat-meta">{meta}</div>
                  <div className={`table-seat-backs ${position}`}>
                    {Array.from(
                      { length: Math.min(seat.cardCount, MAX_BACKS_VISIBLE) },
                      (_, j) => (
                        <CardBack
                          key={j}
                          size="small"
                          layered={{
                            stackIndex: j,
                            spread,
                          }}
                        />
                      ),
                    )}
                    {seat.cardCount > MAX_BACKS_VISIBLE && (
                      <span className="table-seat-extra">
                        +{seat.cardCount - MAX_BACKS_VISIBLE}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Center (empty during play; trick cards are at each seat) */}
        <div className="table-center" />

        {/* Bottom seat (me) - name only; hand is below the table */}
        <div
          className={`table-seat table-seat-bottom self-seat ${isCurrentTurn(0) ? "current-turn" : ""}`}
        >
          {isPlaying && playsBySeat[0] && (
            <div className="trick-slot trick-slot-at-seat trick-slot-bottom">
              <Card card={playsBySeat[0].card} size="small" />
            </div>
          )}
          {players[0] && (
            <>
              <div
                className="table-seat-info"
                aria-label={
                  myPlayer?.playerId === players[0].playerId ? "You" : undefined
                }
              >
                <span className="table-seat-name">
                  {players[0].name}
                  {myPlayer?.playerId === players[0].playerId && (
                    <span className="you-label"> (You)</span>
                  )}
                </span>
                {players[0].isHost && (
                  <span className="pill host-badge">Host</span>
                )}
                {players[0].status === "left" && (
                  <span className="pill left-badge">Left</span>
                )}
                <span className="table-seat-cards">
                  {players[0].cardCount} cards
                </span>
              </div>
              <div className="table-seat-meta">
                Score: {players[0].score} · Tricks: {players[0].tricks}
                {players[0].bid != null ? ` · Bid: ${players[0].bid}` : ""}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
