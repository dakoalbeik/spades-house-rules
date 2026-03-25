import type { TrickPlay, PublicPlayer } from "../types";
import type { PlayerId } from "shared";
import Card from "./Card";
import "./TrickPile.css";

type Area = "top" | "bot" | "left" | "right" | "center";

interface TrickPileProps {
  plays: TrickPlay[];
  players: PublicPlayer[];
  seatToArea: (seatIndex: number) => Area;
  winnerId?: PlayerId;
}

export default function TrickPile({ plays, players, seatToArea, winnerId }: TrickPileProps) {
  if (plays.length === 0) return null;

  const winnerSeat = winnerId
    ? players.findIndex((p) => p.playerId === winnerId)
    : -1;
  const winnerArea: Area | undefined =
    winnerSeat >= 0 ? seatToArea(winnerSeat) : undefined;

  return (
    <div
      className="trick-pile"
      data-collecting={winnerArea ?? undefined}
    >
      {plays.map((play, index) => {
        const seat = players.findIndex((p) => p.playerId === play.playerId);
        const area: Area = seat >= 0 ? seatToArea(seat) : "center";
        const isWinner = play.playerId === winnerId;
        return (
          <div
            key={play.card.id}
            className={`trick-pile-card trick-pile-card-${area}${isWinner ? " trick-pile-card-winner" : ""}`}
            style={{ zIndex: index + 1 }}
          >
            <Card card={play.card} size="small" />
          </div>
        );
      })}
    </div>
  );
}
