import type { GameState, PublicPlayer } from "../types";
import PlayerList from "./PlayerList";
import BiddingPanel from "./BiddingPanel";
import GameTable from "./GameTable";
import Hand from "./Hand";
import "./GameBoard.css";

interface GameBoardProps {
  game: GameState;
  myPlayer: PublicPlayer | undefined;
  bidInput: string;
  onBidInputChange: (bid: string) => void;
  onBid: (bid: number) => void;
  onStart: () => void;
  onNextRound: () => void;
  onPlayCard: (cardId: string) => void;
  canPlay: (cardId: string) => boolean;
  onKick?: (playerId: string) => void;
}

export default function GameBoard({
  game,
  myPlayer,
  onBid,
  onStart,
  onNextRound,
  onPlayCard,
  canPlay,
  onKick,
}: GameBoardProps) {
  const phaseLabel: Record<GameState["phase"], string> = {
    lobby: "Lobby",
    bidding: "Bidding",
    playing: "Playing",
    round_end: "Round finished",
  };

  const isMyTurn = myPlayer?.playerId === game.currentTurnPlayerId;

  return (
    <section className="panel wide">
      <div className="row spaced">
        <div>
          <div className="pill dark">Phase: {phaseLabel[game.phase]}</div>
          <div className="pill dark">Round: {game.roundNumber || 1}</div>
          <div className="pill dark">
            Decks: {game.options.numDecks} • Slots: {game.players.length}/
            {game.options.maxPlayers}
          </div>
        </div>
        <div className="actions">
          {game.phase === "lobby" && myPlayer?.isHost ? (
            <button onClick={onStart}>Start game</button>
          ) : null}
          {game.phase === "round_end" && myPlayer?.isHost ? (
            <button onClick={onNextRound}>Start next round</button>
          ) : null}
        </div>
      </div>

      {game.statusMessage ? (
        <div className="info">{game.statusMessage}</div>
      ) : null}

      {game.phase === "lobby" ? (
        <PlayerList game={game} canKick={myPlayer?.isHost} onKick={onKick} />
      ) : (
        <GameTable game={game} myPlayer={myPlayer} />
      )}

      <BiddingPanel
        game={game}
        myPlayer={myPlayer}
        hand={game.hand}
        onBid={onBid}
      />

      <Hand
        game={game}
        isMyTurn={isMyTurn}
        onPlayCard={onPlayCard}
        canPlay={canPlay}
      />
    </section>
  );
}
