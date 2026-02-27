import type { GameState, PublicPlayer } from "../types";
import PlayerList from "./PlayerList";
import BiddingPanel from "./BiddingPanel";
import TrickDisplay from "./TrickDisplay";
import Hand from "./Hand";
import "./GameBoard.css";

interface GameBoardProps {
  game: GameState;
  myPlayer: PublicPlayer | undefined;
  socketId: string;
  bidInput: string;
  onBidInputChange: (bid: string) => void;
  onBid: () => void;
  onStart: () => void;
  onNextRound: () => void;
  onPlayCard: (cardId: string) => void;
  canPlay: (cardId: string) => boolean;
}

export default function GameBoard({
  game,
  myPlayer,
  socketId,
  bidInput,
  onBidInputChange,
  onBid,
  onStart,
  onNextRound,
  onPlayCard,
  canPlay,
}: GameBoardProps) {
  const phaseLabel: Record<GameState["phase"], string> = {
    lobby: "Lobby",
    bidding: "Bidding",
    playing: "Playing",
    round_end: "Round finished",
  };

  const isMyTurn = game.currentTurnPlayerId === socketId;

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

      <PlayerList game={game} />

      <BiddingPanel
        game={game}
        myPlayer={myPlayer}
        bidInput={bidInput}
        onBidInputChange={onBidInputChange}
        onBid={onBid}
      />

      <TrickDisplay game={game} />

      <Hand
        game={game}
        isMyTurn={isMyTurn}
        onPlayCard={onPlayCard}
        canPlay={canPlay}
      />
    </section>
  );
}

