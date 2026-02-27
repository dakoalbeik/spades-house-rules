import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "shared";
import type { GameState } from "./types";
import {
  saveGameId,
  getGameId,
  clearGameId,
  savePlayerName,
  getPlayerName,
} from "./utils/storage";
import Header from "./components/Header";
import Lobby from "./components/Lobby";
import GameBoard from "./components/GameBoard";
import "./App.css";

const serverUrl = "http://localhost:4000";

function App() {
  const socket = useMemo(() => {
    const s = io(serverUrl, {
      autoConnect: true,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    }) as import("socket.io-client").Socket<ServerToClientEvents, ClientToServerEvents>;
    console.log("Socket.IO client created, connecting to:", serverUrl);
    return s;
  }, []);

  const [socketId, setSocketId] = useState("");
  const [gameId, setGameId] = useState(() => getGameId() || "");
  const [playerName, setPlayerName] = useState(() => getPlayerName() || "");
  const [numDecks, setNumDecks] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [game, setGame] = useState<GameState | null>(null);
  const [bidInput, setBidInput] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState("Connecting...");
  const [isJoining, setIsJoining] = useState(false);
  const [isRejoining, setIsRejoining] = useState(false);
  const rejoinTimeoutRef = useRef<number | null>(null);

  // Save gameId and playerName to localStorage when they change
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

  const handleError = useCallback((message?: string) => {
    setLastError(message ?? null);
    if (message) {
      setTimeout(() => setLastError(null), 3500);
    }
  }, []);

  const handleSuccess = useCallback((message: string) => {
    setLastSuccess(message);
    setTimeout(() => setLastSuccess(null), 3000);
  }, []);

  // Socket event handlers
  useEffect(() => {
    function handleState(next: GameState) {
      setGame(next);
      setGameId(next.id);
      setIsRejoining(false);
      // Clear rejoin timeout if it exists
      if (rejoinTimeoutRef.current) {
        clearTimeout(rejoinTimeoutRef.current);
        rejoinTimeoutRef.current = null;
      }
    }

    socket.on("connect", () => {
      const newSocketId = socket.id ?? "";
      setSocketId(newSocketId);
      setStatus("Connected");

      // Try to rejoin if we have a saved gameId
      const savedGameId = getGameId();
      const savedPlayerName = getPlayerName();

      if (savedGameId && savedPlayerName && !game) {
        console.log("Attempting to rejoin game:", savedGameId);
        setIsRejoining(true);

        // Request state - if we're in the game, we'll get it via gameState event
        // Set a timeout to try joining if no state comes back
        rejoinTimeoutRef.current = setTimeout(() => {
          // If no game state received, try to join
          console.log("No game state received, attempting to join...");
          socket.emit("joinGame", { gameId: savedGameId, playerName: savedPlayerName }, (resp) => {
              setIsRejoining(false);
              if (!resp || !resp.ok) {
                console.log("Could not rejoin game:", resp?.error);
                handleError(
                  resp?.error || "Could not rejoin game. It may have ended."
                );
                clearGameId();
              } else {
                handleSuccess("Rejoined game successfully!");
              }
            }
          );
          rejoinTimeoutRef.current = null;
        }, 1000);

        // Request state - if we're already in the game, we'll receive it
        socket.emit("requestState", { gameId: savedGameId });
      } else if (gameId) {
        // Just request state for current game
        socket.emit("requestState", { gameId });
      }
    });

    socket.on("disconnect", () => setStatus("Disconnected"));
    socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
      setStatus(`Error: ${error.message}`);
    });
    socket.on("gameState", handleState);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("gameState", handleState);
    };
  }, [socket, gameId, game, handleError, handleSuccess]);

  const myPlayer = game?.players.find((p) => p.isSelf);

  const handleGameIdChange = (id: string) => {
    setGameId(id);
  };

  const handlePlayerNameChange = (name: string) => {
    setPlayerName(name);
  };

  const handleStart = () => {
    if (!gameId) return;
    socket.emit("startGame", { gameId }, (resp) => {
      if (!resp?.ok) handleError(resp?.error);
    });
  };

  const handleBid = () => {
    if (!gameId) return;
    const bid = Number(bidInput);
    socket.emit("placeBid", { gameId, bid }, (resp) => {
      if (!resp?.ok) handleError(resp?.error);
      else setBidInput("");
    });
  };

  const handlePlay = (cardId: string) => {
    if (!gameId) return;
    socket.emit("playCard", { gameId, cardId }, (resp) => {
      if (!resp?.ok) handleError(resp?.error);
    });
  };

  const handleNextRound = () => {
    if (!gameId) return;
    socket.emit("startNextRound", { gameId }, (resp) => {
      if (!resp?.ok) handleError(resp?.error);
    });
  };

  const canPlay = (cardId: string) => {
    if (!game || game.phase !== "playing") return false;
    const isMyTurn = game.currentTurnPlayerId === socketId;
    return isMyTurn === true && !!game.hand.find((c) => c.id === cardId);
  };

  return (
    <div className="page">
      <Header status={status} playerName={playerName} gameId={gameId} />

      {isRejoining && (
        <div className="info" style={{ margin: "12px 0" }}>
          Rejoining game...
        </div>
      )}

      {lastError ? <div className="error">{lastError}</div> : null}
      {lastSuccess ? <div className="success">{lastSuccess}</div> : null}

      {!game ? (
        <Lobby
          socket={socket}
          gameId={gameId}
          playerName={playerName}
          numDecks={numDecks}
          maxPlayers={maxPlayers}
          onGameIdChange={handleGameIdChange}
          onPlayerNameChange={handlePlayerNameChange}
          onNumDecksChange={setNumDecks}
          onMaxPlayersChange={setMaxPlayers}
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
          socketId={socketId}
          bidInput={bidInput}
          onBidInputChange={setBidInput}
          onBid={handleBid}
          onStart={handleStart}
          onNextRound={handleNextRound}
          onPlayCard={handlePlay}
          canPlay={canPlay}
        />
      )}
    </div>
  );
}

export default App;
