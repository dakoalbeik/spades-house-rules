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
            <div className="pill dark">Phase: {phaseLabel[game.phase]}</div>
            <div className="pill dark">Round: {game.roundNumber || 1}</div>
            <div className="pill dark">
              Decks: {game.options.numDecks} &middot; {game.players.length}/
              {game.options.maxPlayers} &middot; Nil: {game.options.nilScore ?? 100}
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
            {myPlayer?.isHost && onEndGame && (
              <button className="btn-end-game" onClick={onEndGame}>
                End game
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
                {game.players.find(
                  (p) =>
                    p.playerId === game.pendingDuplicateChoice?.playerId,
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
