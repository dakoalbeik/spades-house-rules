import type { GameState } from "shared";
import {
  getCurrentTurn,
  getLegalCardIds,
  placeBidForCurrentBidder,
  playCard,
  resolveDuplicateCard,
  prepareTrickResolution,
  finalizeTrick,
} from "../gameLogic";
import type { GameRepository } from "./GameRepository";

const AUTO_BID_DELAY_MS = 700;
const AUTO_PLAY_DELAY_MS = 1100;
const TRICK_DISPLAY_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AutoAdvanceScheduler {
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  schedule(
    game: GameState,
    games: GameRepository,
    broadcast: (g: GameState) => void,
  ): void {
    this.cancel(game.id);

    if (!game.autoBid && !game.autoPlay) return;
    // Don't schedule while the trick-resolution animation is running — the
    // playCard / resolveDuplicate handler is already sleeping and will call
    // finalizeTrick, after which it should trigger the next schedule.
    if (game.trickResolution) return;
    if (game.phase !== "bidding" && game.phase !== "playing") return;
    if (game.phase === "bidding" && !game.autoBid) return;
    if (game.phase === "playing" && !game.autoPlay) return;

    const delay =
      game.phase === "bidding" ? AUTO_BID_DELAY_MS : AUTO_PLAY_DELAY_MS;

    const timer = setTimeout(async () => {
      this.timers.delete(game.id);
      const current = games.get(game.id);
      if (!current) return;
      await this.advance(current, games, broadcast);
    }, delay);

    this.timers.set(game.id, timer);
  }

  cancel(gameId: string): void {
    const t = this.timers.get(gameId);
    if (t) {
      clearTimeout(t);
      this.timers.delete(gameId);
    }
  }

  private async advance(
    game: GameState,
    games: GameRepository,
    broadcast: (g: GameState) => void,
  ): Promise<void> {
    if (game.phase === "bidding" && game.autoBid) {
      const player = game.players[game.bidIndex];
      if (!player) return;
      const bid = Math.floor(Math.random() * (player.hand.length + 1));
      const result = placeBidForCurrentBidder(game, bid);
      if (!result.ok) return;
      broadcast(game);
      games.save();
      this.schedule(game, games, broadcast);
      return;
    }

    if (game.phase === "playing" && game.autoPlay) {
      if (game.pendingDuplicateChoice) {
        await this.autoResolveDuplicate(game, games, broadcast);
        return;
      }

      const currentTurnId = getCurrentTurn(game);
      if (!currentTurnId) return;
      const player = game.players.find((p) => p.playerId === currentTurnId);
      if (!player) return;

      const legalIds = getLegalCardIds(game, player);
      if (legalIds.length === 0) return;
      const cardId = legalIds[Math.floor(Math.random() * legalIds.length)];

      const result = playCard(game, player.playerId, cardId);
      if (!result.ok) return;

      broadcast(game);
      games.save();

      if (result.trickComplete && !result.pendingDuplicateChoice) {
        await this.resolveTrick(game, games, broadcast);
      } else {
        this.schedule(game, games, broadcast);
      }
    }
  }

  private async autoResolveDuplicate(
    game: GameState,
    games: GameRepository,
    broadcast: (g: GameState) => void,
  ): Promise<void> {
    const pending = game.pendingDuplicateChoice;
    if (!pending) return;

    const result = resolveDuplicateCard(game, pending.playerId, "lose");
    if (!result.ok) return;

    broadcast(game);
    games.save();

    if (result.trickComplete) {
      await this.resolveTrick(game, games, broadcast);
    } else {
      this.schedule(game, games, broadcast);
    }
  }

  private async resolveTrick(
    game: GameState,
    games: GameRepository,
    broadcast: (g: GameState) => void,
  ): Promise<void> {
    prepareTrickResolution(game);
    broadcast(game);
    games.save();
    await sleep(TRICK_DISPLAY_DELAY_MS);
    // Guard: game may have been deleted while we were sleeping
    if (!games.get(game.id)) return;
    finalizeTrick(game);
    broadcast(game);
    games.save();
    this.schedule(game, games, broadcast);
  }
}
