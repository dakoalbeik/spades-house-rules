import { useState } from "react";
import type { GameState, PublicPlayer } from "../types";
import PlayerList from "./PlayerList";
import BiddingPanel from "./BiddingPanel";
import GameTable from "./GameTable";
import Hand from "./Hand";
import ScoreModal from "./ScoreModal";
import "./GameBoard.css";
import type { PlayerId } from "shared";
import type { CardId } from "shared/dist/game";

interface GameBoardProps {
  game: GameState;
  myPlayer: PublicPlayer | undefined;
  bidInput: string;
  onBidInputChange: (bid: string) => void;
  onBid: (bid: number) => void;
  onStart: () => void;
  onNextRound: () => void;
  onPlayCard: (cardId: CardId) => void;
  canPlay: (cardId: CardId) => boolean;
  onKick?: (playerId: PlayerId) => void;
  onLeave?: () => void;
  onCancelRound?: () => void;
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
  onLeave,
  onCancelRound,
}: GameBoardProps) {
  const [showScores, setShowScores] = useState(false);

  const phaseLabel: Record<GameState["phase"], string> = {
    lobby: "Lobby",
    bidding: "Bidding",
    playing: "Playing",
    round_end: "Round finished",
  };

  const isMyTurn = myPlayer?.playerId === game.currentTurnPlayerId;
  const isActive = game.phase !== "lobby";

  return (
    <div className={`game-board ${isActive ? "game-board-active" : ""}`}>
      {/* Header bar */}
      <div className="game-board-header">
        <div className="row spaced">
          <div className="row gap">
            <div className="pill dark">Phase: {phaseLabel[game.phase]}</div>
            <div className="pill dark">Round: {game.roundNumber || 1}</div>
            <div className="pill dark">
              Decks: {game.options.numDecks} &middot; {game.players.length}/
              {game.options.maxPlayers}
            </div>
          </div>
          <div className="actions">
            {isActive && (
              <button
                className="btn-scores"
                onClick={() => setShowScores(true)}
              >
                Scores
              </button>
            )}
            {game.phase === "lobby" && myPlayer?.isHost && (
              <button onClick={onStart}>Start game</button>
            )}
            {game.phase === "round_end" && myPlayer?.isHost && (
              <button onClick={onNextRound}>Start next round</button>
            )}
            {(game.phase === "bidding" || game.phase === "playing") &&
              myPlayer?.isHost &&
              onCancelRound && (
                <button className="btn-cancel-round" onClick={onCancelRound}>
                  Dismiss round
                </button>
              )}
            {onLeave && (
              <button className="btn-leave" onClick={onLeave}>
                Leave
              </button>
            )}
          </div>
        </div>
        {game.statusMessage && <div className="info">{game.statusMessage}</div>}
      </div>

      {/* Main area */}
      <div className="game-board-play-area">
        {game.phase === "lobby" ? (
          <PlayerList game={game} canKick={myPlayer?.isHost} onKick={onKick} />
        ) : (
          <GameTable game={game} myPlayer={myPlayer} />
        )}
      </div>

      {/* Footer: bidding panel + player hand (sticky at bottom) */}
      {isActive && (
        <div className="game-board-footer">
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
        </div>
      )}

      {/* Score modal */}
      {showScores && (
        <ScoreModal game={game} onClose={() => setShowScores(false)} />
      )}
    </div>
  );
}
