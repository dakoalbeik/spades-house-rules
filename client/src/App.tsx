import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "shared";
import type { GameState } from "./types";
import {
  saveGameId,
  getGameId,
  clearGameId,
  savePlayerId,
  getPlayerId,
  clearPlayerId,
  savePlayerName,
  getPlayerName,
} from "./utils/storage";
import Header from "./components/Header";
import Lobby from "./components/Lobby";
import GameBoard from "./components/GameBoard";
import ToastContainer from "./components/Toast";
import LoadingScreen from "./components/LoadingScreen";
import { useToast } from "./hooks/useToast";
import "./App.css";
import type { CardId, GameId, PlayerId } from "shared/dist/game";

const serverUrl = "http://localhost:4000";

function App() {
  const socket = useMemo(() => {
    const s = io(serverUrl, {
      autoConnect: true,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    }) as import("socket.io-client").Socket<
      ServerToClientEvents,
      ClientToServerEvents
    >;
    console.log("Socket.IO client created, connecting to:", serverUrl);
    return s;
  }, []);

  const [gameId, setGameId] = useState<GameId | "">(() => getGameId() || "");
  const [playerName, setPlayerName] = useState(() => getPlayerName() || "");
  const [numDecks, setNumDecks] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [nilScore, setNilScore] = useState(100);
  const [game, setGame] = useState<GameState | null>(null);
  const { toasts, dismiss, showError, showSuccess } = useToast();
  const [status, setStatus] = useState("Connecting...");
  const [isJoining, setIsJoining] = useState(false);
  const [isRejoining, setIsRejoining] = useState(false);

  // Update document title to reflect host status
  useEffect(() => {
    const isHost = game?.players.find((p) => p.isSelf)?.isHost;
    if (isHost) {
      document.title = "Spades — Host";
    } else {
      document.title = "Spades";
    }
  }, [game]);

  // Save gameId and playerName to sessionStorage when they change
  useEffect(() => {
    if (gameId) {
      saveGameId(gameId);
    } else {
      clearGameId();
    }
  }, [gameId]);

  useEffect(() => {
    if (playerName) {
      savePlayerName(playerName);
    }
  }, [playerName]);

  const handleError = useCallback(
    (message?: string) => {
      if (message) showError(message);
    },
    [showError],
  );

  const handleSuccess = useCallback(
    (message: string) => {
      showSuccess(message);
    },
    [showSuccess],
  );

  // Socket event handlers
  useEffect(() => {
    function handleState(next: GameState) {
      setGame(next);
      setGameId(next.id);
      setIsRejoining(false);
    }

    socket.on("connect", () => {
      setStatus("Connected");

      // Rejoin by gameId + playerId (session storage) so this tab recovers after refresh
      const savedGameId = getGameId();
      const savedPlayerName = getPlayerName();
      const savedPlayerId = getPlayerId();

      // Always rejoin via joinGame when we have saved credentials — this
      // updates slot.id on the server so the player's hand is re-attached to
      // the new socket. Skipping this (e.g. calling requestState instead)
      // causes an empty hand because the server can't match the new socket.id
      // to the player who has their cards.
      if (savedGameId && savedPlayerId) {
        setIsRejoining(true);
        socket.emit(
          "joinGame",
          {
            gameId: savedGameId,
            playerId: savedPlayerId,
            playerName: savedPlayerName ?? undefined,
          },
          (resp) => {
            setIsRejoining(false);
            if (!resp || !resp.ok) {
              console.log("Could not rejoin game:", resp?.error);
              // Only show error if the game actually ended; silent on minor reconnects
              if (!game) {
                handleError(
                  resp?.error || "Could not rejoin game. It may have ended.",
                );
              }
              clearGameId();
              clearPlayerId();
            }
          },
        );
      } else if (gameId) {
        socket.emit("requestState", { gameId });
      }
    });

    socket.on("disconnect", () => setStatus("Disconnected"));
    socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
      setStatus(`Error: ${error.message}`);
    });
    socket.on("gameState", handleState);
    socket.on("kicked", (message) => {
      setGame(null);
      setGameId("");
      clearGameId();
      clearPlayerId();
      handleError(message || "You were kicked from the lobby");
    });

    socket.on("gameEnded", (message) => {
      setGame(null);
      setGameId("");
      clearGameId();
      clearPlayerId();
      handleError(message || "The game has ended");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("gameState", handleState);
      socket.off("kicked");
      socket.off("gameEnded");
    };
  }, [socket, gameId, game, handleError, handleSuccess]);

  const myPlayer = game?.players.find((p) => p.isSelf);

  const handleGameIdChange = (id: string) => {
    setGameId(id as GameId);
  };

  const handleJoinedGame = useCallback((id: GameId, playerId: PlayerId) => {
    saveGameId(id);
    savePlayerId(playerId);
    setGameId(id);
  }, []);

  const handlePlayerNameChange = (name: string) => {
    setPlayerName(name);
  };

  const handleStart = () => {
    if (!gameId) return;
    socket.emit("startGame", { gameId }, (resp) => {
      if (!resp?.ok) handleError(resp?.error);
    });
  };

  const handleBid = (bid: number) => {
    if (!gameId || !myPlayer) return;
    socket.emit("placeBid", { gameId, playerId: myPlayer.playerId, bid }, (resp) => {
      if (!resp?.ok) handleError(resp?.error);
    });
  };

  const handlePlay = (cardId: CardId) => {
    if (!gameId || !myPlayer) return;
    socket.emit("playCard", { gameId, playerId: myPlayer.playerId, cardId }, (resp) => {
      if (!resp?.ok) handleError(resp?.error);
    });
  };

  const handleNextRound = () => {
    if (!gameId) return;
    socket.emit("startNextRound", { gameId }, (resp) => {
      if (!resp?.ok) handleError(resp?.error);
    });
  };

  const handleKick = (playerId: PlayerId) => {
    if (!gameId) return;
    socket.emit("kickPlayer", { gameId, playerId }, (resp) => {
      if (!resp?.ok) handleError(resp?.error);
    });
  };

  const handleResolveDuplicate = (choice: "win" | "lose") => {
    if (!gameId || !myPlayer) return;
    socket.emit("resolveDuplicateCard", { gameId, playerId: myPlayer.playerId, choice }, (resp) => {
      if (!resp?.ok) handleError(resp?.error);
    });
  };

  const handleCancelRound = () => {
    if (!gameId) return;
    socket.emit("cancelRound", { gameId }, (resp) => {
      if (!resp?.ok) handleError(resp?.error);
    });
  };

  const handleEndGame = () => {
    if (!gameId) return;
    socket.emit("endGame", { gameId }, (resp) => {
      if (!resp?.ok) handleError(resp?.error);
      // On success the server emits `gameEnded` to all players including us,
      // so we don't need to reset state here — the listener handles it.
    });
  };

  const handleLeave = () => {
    if (!gameId) return;
    socket.emit("leaveGame", { gameId }, (resp) => {
      if (!resp?.ok) {
        handleError(resp?.error);
        return;
      }
      setGame(null);
      setGameId("");
      clearGameId();
      clearPlayerId();
    });
  };

  const canPlay = (cardId: string) => {
    if (!game || game.phase !== "playing") return false;
    const isMyTurn = myPlayer?.playerId === game.currentTurnPlayerId;
    return isMyTurn && !!game.hand.find((c) => c.id === cardId);
  };

  const isLoading = status === "Connecting..." || isRejoining;
  const loadingMessage = isRejoining
    ? "Rejoining your game..."
    : "Connecting to server...";

  if (isLoading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  return (
    <div className={`page ${game ? "page-ingame" : ""}`}>
      <Header status={status} playerName={playerName} gameId={gameId} isIngame={!!game} />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {!game ? (
        <Lobby
          socket={socket}
          gameId={gameId}
          playerName={playerName}
          numDecks={numDecks}
          maxPlayers={maxPlayers}
          nilScore={nilScore}
          onGameIdChange={handleGameIdChange}
          onJoinedGame={handleJoinedGame}
          onPlayerNameChange={handlePlayerNameChange}
          onNumDecksChange={setNumDecks}
          onMaxPlayersChange={setMaxPlayers}
          onNilScoreChange={setNilScore}
          onError={handleError}
          onSuccess={handleSuccess}
          isJoining={isJoining}
          onJoiningChange={setIsJoining}
          isConnected={socket.connected}
        />
      ) : (
        <GameBoard
          game={game}
          myPlayer={myPlayer}
          onBid={handleBid}
          onStart={handleStart}
          onNextRound={handleNextRound}
          onPlayCard={handlePlay}
          canPlay={canPlay}
          onKick={handleKick}
          onLeave={handleLeave}
          onCancelRound={handleCancelRound}
          onEndGame={handleEndGame}
          onResolveDuplicate={handleResolveDuplicate}
        />
      )}
    </div>
  );
}

export default App;
