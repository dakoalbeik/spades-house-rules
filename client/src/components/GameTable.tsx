import type { GameState, PublicPlayer } from "../types";
import Card from "./Card";
import CardBack from "./CardBack";
import "./GameTable.css";

const SEATS = ["bottom", "left", "top", "right"] as const;
const MAX_BACKS_VISIBLE = 10;

interface GameTableProps {
  game: GameState;
  myPlayer: PublicPlayer | undefined;
  socketId: string;
}

/** Get players in table order: [me, left, top, right] */
function getSeatOrder(game: GameState, myPlayerId: string): (PublicPlayer | null)[] {
  const n = game.players.length;
  if (n === 0) return [null, null, null, null];
  const myIndex = game.players.findIndex((p) => p.id === myPlayerId);
  const order: (PublicPlayer | null)[] = [];
  for (let i = 0; i < 4; i++) {
    order.push(game.players[(myIndex + i + n) % n] ?? null);
  }
  return order;
}

/** Which seat (index 0–3) has this playerId in our display order */
function getSeatIndex(seatOrder: (PublicPlayer | null)[], playerId: string): number {
  const i = seatOrder.findIndex((p) => p?.id === playerId);
  return i >= 0 ? i : 0;
}

export default function GameTable({ game, myPlayer, socketId }: GameTableProps) {
  const seatOrder = getSeatOrder(game, socketId);
  const isPlaying = game.phase === "playing";
  const trick = game.currentTrick;
  const playsBySeat: (NonNullable<typeof trick>["plays"][number] | null)[] = [null, null, null, null];
  if (trick?.plays) {
    for (const play of trick.plays) {
      const seat = getSeatIndex(seatOrder, play.playerId);
      playsBySeat[seat] = play;
    }
  }

  const isCurrentTurn = (seat: PublicPlayer | null) =>
    seat && game.currentTurnPlayerId === seat.id;

  return (
    <div className="game-table">
      <div className="table-surface">
        {/* Top seat */}
        <div className={`table-seat table-seat-top ${isCurrentTurn(seatOrder[2]) ? "current-turn" : ""}`}>
          {seatOrder[2] && (
            <>
              <div className="table-seat-info">
                <span className="table-seat-name">{seatOrder[2].name}</span>
                {seatOrder[2].isHost && <span className="pill host-badge">Host</span>}
              </div>
              <div className="table-seat-meta">
                Score: {seatOrder[2].score} · Tricks: {seatOrder[2].tricks}
                {seatOrder[2].bid != null ? ` · Bid: ${seatOrder[2].bid}` : ""}
              </div>
              <div className="table-seat-backs">
                {Array.from(
                  { length: Math.min(seatOrder[2].cardCount, MAX_BACKS_VISIBLE) },
                  (_, i) => (
                    <CardBack key={i} size="small" stackIndex={i} />
                  )
                )}
                {seatOrder[2].cardCount > MAX_BACKS_VISIBLE && (
                  <span className="table-seat-extra">+{seatOrder[2].cardCount - MAX_BACKS_VISIBLE}</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Left seat */}
        <div className={`table-seat table-seat-left ${isCurrentTurn(seatOrder[1]) ? "current-turn" : ""}`}>
          {seatOrder[1] && (
            <>
              <div className="table-seat-info">
                <span className="table-seat-name">{seatOrder[1].name}</span>
                {seatOrder[1].isHost && <span className="pill host-badge">Host</span>}
              </div>
              <div className="table-seat-meta">
                {seatOrder[1].score} · T: {seatOrder[1].tricks}
                {seatOrder[1].bid != null ? ` · B: ${seatOrder[1].bid}` : ""}
              </div>
              <div className="table-seat-backs">
                {Array.from(
                  { length: Math.min(seatOrder[1].cardCount, MAX_BACKS_VISIBLE) },
                  (_, i) => (
                    <CardBack key={i} size="small" stackIndex={i} />
                  )
                )}
                {seatOrder[1].cardCount > MAX_BACKS_VISIBLE && (
                  <span className="table-seat-extra">+{seatOrder[1].cardCount - MAX_BACKS_VISIBLE}</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Center: current trick */}
        <div className="table-center">
          {isPlaying && (
            <div className="trick-zone">
              {SEATS.map((seat, idx) => (
                <div key={seat} className={`trick-slot trick-slot-${seat}`}>
                  {playsBySeat[idx] ? (
                    <Card card={playsBySeat[idx]!.card} size="small" />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right seat */}
        <div className={`table-seat table-seat-right ${isCurrentTurn(seatOrder[3]) ? "current-turn" : ""}`}>
          {seatOrder[3] && (
            <>
              <div className="table-seat-info">
                <span className="table-seat-name">{seatOrder[3].name}</span>
                {seatOrder[3].isHost && <span className="pill host-badge">Host</span>}
              </div>
              <div className="table-seat-meta">
                {seatOrder[3].score} · T: {seatOrder[3].tricks}
                {seatOrder[3].bid != null ? ` · B: ${seatOrder[3].bid}` : ""}
              </div>
              <div className="table-seat-backs">
                {Array.from(
                  { length: Math.min(seatOrder[3].cardCount, MAX_BACKS_VISIBLE) },
                  (_, i) => (
                    <CardBack key={i} size="small" stackIndex={i} />
                  )
                )}
                {seatOrder[3].cardCount > MAX_BACKS_VISIBLE && (
                  <span className="table-seat-extra">+{seatOrder[3].cardCount - MAX_BACKS_VISIBLE}</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bottom seat (me) - name only; hand is below the table */}
        <div className={`table-seat table-seat-bottom self-seat ${isCurrentTurn(seatOrder[0]) ? "current-turn" : ""}`}>
          {seatOrder[0] && (
            <>
              <div className="table-seat-info" aria-label={myPlayer?.id === seatOrder[0].id ? "You" : undefined}>
                <span className="table-seat-name">
                  {seatOrder[0].name}
                  {myPlayer?.id === seatOrder[0].id && <span className="you-label"> (You)</span>}
                </span>
                {seatOrder[0].isHost && <span className="pill host-badge">Host</span>}
                <span className="table-seat-cards">{seatOrder[0].cardCount} cards</span>
              </div>
              <div className="table-seat-meta">
                Score: {seatOrder[0].score} · Tricks: {seatOrder[0].tricks}
                {seatOrder[0].bid != null ? ` · Bid: ${seatOrder[0].bid}` : ""}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
