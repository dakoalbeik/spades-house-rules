import { useState } from "react";
import {
  BarChart2,
  Play,
  SkipForward,
  XCircle,
  StopCircle,
  LogOut,
} from "lucide-react";
import type { GameState, PublicPlayer } from "../types";
import SeatSelection from "./SeatSelection";
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
  onBid: (bid: number) => void;
  onStart: () => void;
  onNextRound: () => void;
  onPlayCard: (cardId: CardId) => void;
  canPlay: (cardId: CardId) => boolean;
  onKick?: (playerId: PlayerId) => void;
  onLeave?: () => void;
  onCancelRound?: () => void;
  onEndGame?: () => void;
  onResolveDuplicate?: (choice: "win" | "lose") => void;
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
  onEndGame,
  onResolveDuplicate,
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
  const isDuplicateChooser =
    game.pendingDuplicateChoice?.playerId === myPlayer?.playerId;

  return (
    <div className={`game-board ${isActive ? "game-board-active" : ""}`}>
      {/* Header bar */}
      <div className="game-board-header">
        <div className="row spaced">
          <div className="row gap">
            <div className="pill dark">{phaseLabel[game.phase]}</div>
            <div className="pill dark">R{game.roundNumber || 1}</div>
            <div className="pill dark hide-landscape">
              {game.options.numDecks}D &middot; {1 + game.opponents.length}/
              {game.options.maxPlayers}
            </div>
          </div>
          <div className="actions">
            {isActive && (
              <button
                className="btn-icon btn-icon-neutral"
                title="Scores"
                aria-label="Scores"
                onClick={() => setShowScores(true)}
              >
                <BarChart2 size={18} />
              </button>
            )}
            {game.phase === "lobby" && myPlayer?.isHost && (
              <button
                className="btn-icon btn-icon-primary"
                title="Start game"
                aria-label="Start game"
                onClick={onStart}
              >
                <Play size={18} />
              </button>
            )}
            {game.phase === "round_end" && myPlayer?.isHost && (
              <button
                className="btn-icon btn-icon-primary"
                title="Start next round"
                aria-label="Start next round"
                onClick={onNextRound}
              >
                <SkipForward size={18} />
              </button>
            )}
            {(game.phase === "bidding" || game.phase === "playing") &&
              myPlayer?.isHost &&
              onCancelRound && (
                <button
                  className="btn-icon btn-icon-warn"
                  title="Dismiss round"
                  aria-label="Dismiss round"
                  onClick={onCancelRound}
                >
                  <XCircle size={18} />
                </button>
              )}
            {myPlayer?.isHost && onEndGame && (
              <button
                className="btn-icon btn-icon-danger"
                title="End game"
                aria-label="End game"
                onClick={onEndGame}
              >
                <StopCircle size={18} />
              </button>
            )}
            {onLeave && (
              <button
                className="btn-icon btn-icon-danger"
                title="Leave game"
                aria-label="Leave game"
                onClick={onLeave}
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
        {game.statusMessage && <div className="info">{game.statusMessage}</div>}
      </div>

      {/* Main area */}
      <div className="game-board-play-area">
        {game.phase === "lobby" ? (
          <SeatSelection game={game} canKick={myPlayer?.isHost} onKick={onKick} />
        ) : (
          <GameTable game={game} />
        )}
      </div>

      {/* Bidding modal overlay */}
      <BiddingPanel
        game={game}
        myPlayer={myPlayer}
        hand={game.hand}
        onBid={onBid}
      />

      {/* Footer: player hand (sticky at bottom) */}
      {isActive && (
        <div className="game-board-footer">
          <Hand
            game={game}
            isMyTurn={isMyTurn}
            onPlayCard={onPlayCard}
            canPlay={canPlay}
          />
        </div>
      )}

      {/* Duplicate card choice overlay */}
      {game.pendingDuplicateChoice && (
        <div className="duplicate-choice-overlay">
          <div className="duplicate-choice-modal">
            {isDuplicateChooser ? (
              <>
                <p className="duplicate-choice-title">
                  You played a duplicate{" "}
                  <strong>
                    {game.pendingDuplicateChoice.card.rank} of{" "}
                    {game.pendingDuplicateChoice.card.suit}
                  </strong>
                  . Do you want to win or lose this trick?
                </p>
                <div className="duplicate-choice-actions">
                  <button
                    className="btn-win"
                    onClick={() => onResolveDuplicate?.("win")}
                  >
                    Win the trick
                  </button>
                  <button
                    className="btn-lose"
                    onClick={() => onResolveDuplicate?.("lose")}
                  >
                    Lose the trick
                  </button>
                </div>
              </>
            ) : (
              <p className="duplicate-choice-title">
                {[game.player, ...game.opponents].find(
                  (p) => p.playerId === game.pendingDuplicateChoice?.playerId,
                )?.name ?? "A player"}{" "}
                played a duplicate{" "}
                <strong>
                  {game.pendingDuplicateChoice.card.rank} of{" "}
                  {game.pendingDuplicateChoice.card.suit}
                </strong>{" "}
                — waiting for them to choose...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Score modal */}
      {showScores && (
        <ScoreModal game={game} onClose={() => setShowScores(false)} />
      )}
    </div>
  );
}
