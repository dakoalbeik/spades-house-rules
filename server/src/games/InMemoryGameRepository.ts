import type { GameState } from "shared";
import { loadGames, saveGames } from "../persistence";
import type { GameRepository } from "./GameRepository";

export class InMemoryGameRepository implements GameRepository {
  private readonly games: Map<string, GameState>;

  constructor() {
    this.games = new Map(loadGames());
  }

  get(id: string): GameState | undefined {
    return this.games.get(id);
  }

  set(id: string, game: GameState): void {
    this.games.set(id, game);
  }

  delete(id: string): void {
    this.games.delete(id);
  }

  has(id: string): boolean {
    return this.games.has(id);
  }

  all(): GameState[] {
    return Array.from(this.games.values());
  }

  save(): void {
    saveGames(this.games);
  }

  cleanup(maxAgeMs: number): number {
    const cutoff = Date.now() - maxAgeMs;
    let removed = 0;
    for (const [id, state] of this.games.entries()) {
      if (state.createdAt > 0 && state.createdAt < cutoff) {
        this.games.delete(id);
        removed += 1;
      }
    }
    return removed;
  }
}
