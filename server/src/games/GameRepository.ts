import type { GameState } from "shared";

export interface GameRepository {
  get(id: string): GameState | undefined;
  set(id: string, game: GameState): void;
  delete(id: string): void;
  has(id: string): boolean;
  all(): GameState[];
  /** Flush current state to the underlying persistence layer. */
  save(): void;
  /** Remove games older than maxAgeMs. Returns the number of games removed. */
  cleanup(maxAgeMs: number): number;
}
