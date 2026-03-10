import type { TrickPlay, PublicPlayer } from "../types";
import Card from "./Card";
import "./TrickPile.css";

type Area = "top" | "bot" | "left" | "right" | "center";

interface TrickPileProps {
  plays: TrickPlay[];
  players: PublicPlayer[];
  seatToArea: (seatIndex: number) => Area;
}

export default function TrickPile({ plays, players, seatToArea }: TrickPileProps) {
  if (plays.length === 0) return null;

  return (
    <div className="trick-pile">
      {plays.map((play, index) => {
        const seat = players.findIndex((p) => p.playerId === play.playerId);
        const area: Area = seat >= 0 ? seatToArea(seat) : "center";
        return (
          <div
            key={play.card.id}
            className={`trick-pile-card trick-pile-card-${area}`}
            style={{ zIndex: index + 1 }}
          >
            <Card card={play.card} size="small" />
          </div>
        );
      })}
    </div>
  );
}
