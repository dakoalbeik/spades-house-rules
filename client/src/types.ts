/**
 * Client UI types: re-export from shared so components can import from "../types".
 * GameState here is the view/wire format (GameStatePayload).
 */
export type {
  Card,
  ChatBubble,
  CurrentTrick,
  GamePhase,
  GameStatePayload as GameState,
  PublicPlayer,
  Rank,
  Suit,
  TrickPlay,
} from "shared";
