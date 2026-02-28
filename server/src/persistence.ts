import fs from "fs";
import path from "path";
import type { GameState, PlayerState } from "./types";

const DEFAULT_PATH = path.join(process.cwd(), "data", "gamestate.json");

function ensureDataDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadGames(filePath: string = DEFAULT_PATH): Map<string, GameState> {
  const map = new Map<string, GameState>();
  if (!fs.existsSync(filePath)) {
    return map;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as Record<string, GameState>;
    if (data && typeof data === "object") {
      for (const [id, state] of Object.entries(data)) {
        if (state && state.id && state.players && Array.isArray(state.players)) {
          const game = state as GameState;
          if (typeof game.createdAt !== "number") {
            game.createdAt = 0;
          }
          for (const p of game.players) {
            if (!p.playerId) {
              (p as PlayerState).playerId = p.id;
            }
          }
          map.set(id, game);
        }
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to load gamestate file:", err);
  }
  return map;
}

export function saveGames(games: Map<string, GameState>, filePath: string = DEFAULT_PATH): void {
  try {
    ensureDataDir(filePath);
    const obj: Record<string, GameState> = {};
    for (const [id, state] of games) {
      obj[id] = state;
    }
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf-8");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to save gamestate file:", err);
  }
}

/** Remove games older than maxAgeMs (by createdAt). Returns number removed. */
export function cleanupOldGames(
  games: Map<string, GameState>,
  maxAgeMs: number
): number {
  const cutoff = Date.now() - maxAgeMs;
  let removed = 0;
  for (const [id, state] of games.entries()) {
    if (state.createdAt > 0 && state.createdAt < cutoff) {
      games.delete(id);
      removed += 1;
    }
  }
  return removed;
}
