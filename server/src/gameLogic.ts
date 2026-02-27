import { randomUUID } from "crypto";
import {
  Card,
  CurrentTrick,
  GameOptions,
  GamePhase,
  GameState,
  PlayerState,
  Rank,
  SerializedGame,
  Suit,
} from "./types";

const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const ranks: Rank[] = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];
const rankStrength: Record<Rank, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const MIN_DECKS = 1;
export const MAX_DECKS = 3;

export function generateGameId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join("");
}

function buildDeck(numDecks: number): Card[] {
  const cards: Card[] = [];
  for (let deckIndex = 0; deckIndex < numDecks; deckIndex += 1) {
    for (const suit of suits) {
      for (const rank of ranks) {
        cards.push({
          id: `${deckIndex}-${rank}-${suit}-${randomUUID().slice(0, 8)}`,
          suit,
          rank,
          deckIndex,
        });
      }
    }
  }
  return cards;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getPlayOrder(game: GameState): string[] {
  if (!game.currentTrick) return [];
  const leaderIndex = game.players.findIndex(
    (p) => p.id === game.currentTrick?.leaderId
  );
  if (leaderIndex === -1) return game.players.map((p) => p.id);

  const ordered: string[] = [];
  for (let i = 0; i < game.players.length; i += 1) {
    const idx = (leaderIndex + i) % game.players.length;
    ordered.push(game.players[idx].id);
  }
  return ordered;
}

export function getCurrentTurn(game: GameState): string | null {
  if (game.phase === "bidding") {
    return game.players[game.bidIndex]?.id ?? null;
  }
  if (game.phase === "playing" && game.currentTrick) {
    const order = getPlayOrder(game);
    return order[game.currentTrick.plays.length] ?? null;
  }
  return null;
}

function determineTrickWinner(trick: CurrentTrick): string {
  const leadSuit = trick.leadSuit ?? trick.plays[0]?.card.suit;
  let winning = trick.plays[0];
  for (let i = 1; i < trick.plays.length; i += 1) {
    const play = trick.plays[i];
    const winningCard = winning.card;
    const card = play.card;

    if (card.suit === "spades" && winningCard.suit !== "spades") {
      winning = play;
      continue;
    }
    if (card.suit === winningCard.suit) {
      if (rankStrength[card.rank] > rankStrength[winningCard.rank]) {
        winning = play;
      }
      continue;
    }
    if (card.suit === leadSuit && winningCard.suit !== "spades") {
      if (rankStrength[card.rank] > rankStrength[winningCard.rank]) {
        winning = play;
      }
    }
  }
  return winning.playerId;
}

function scoreRound(game: GameState): void {
  for (const player of game.players) {
    const bid = player.bid ?? 0;
    if (player.tricks >= bid) {
      player.score += bid * 10 + (player.tricks - bid);
    } else {
      player.score -= bid * 10;
    }
    player.bid = undefined;
    player.tricks = 0;
  }
  game.phase = "round_end";
  game.statusMessage = `Round ${game.roundNumber} finished`;
}

export function serializeGame(
  game: GameState,
  viewerId: string
): SerializedGame {
  const viewer = game.players.find((p) => p.id === viewerId);
  const currentTurn = getCurrentTurn(game);
  return {
    id: game.id,
    phase: game.phase,
    options: game.options,
    roundNumber: game.roundNumber,
    spadesBroken: game.spadesBroken,
    currentTrick: game.currentTrick,
    statusMessage: game.statusMessage,
    currentTurnPlayerId: currentTurn,
    hand: viewer?.hand ?? [],
    players: game.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      tricks: p.tricks,
      bid: p.bid,
      cardCount: p.hand.length,
      isHost: p.isHost,
      isSelf: p.id === viewerId,
    })),
  };
}

export function createGame(
  hostId: string,
  hostName: string,
  options: GameOptions
): GameState {
  return {
    id: generateGameId(),
    hostId,
    options,
    players: [
      {
        id: hostId,
        name: hostName,
        hand: [],
        tricks: 0,
        score: 0,
        isHost: true,
      },
    ],
    phase: "lobby",
    currentTrick: undefined,
    spadesBroken: false,
    bidIndex: 0,
    roundNumber: 0,
    statusMessage: "Waiting for players...",
  };
}

export function startRound(
  game: GameState
): { ok: true } | { ok: false; error: string } {
  if (game.players.length < MIN_PLAYERS) {
    return { ok: false, error: `Need at least ${MIN_PLAYERS} players` };
  }
  game.roundNumber += 1;
  const deck = shuffle(buildDeck(game.options.numDecks));
  for (const player of game.players) {
    player.hand = [];
    player.bid = undefined;
    player.tricks = 0;
  }

  let idx = 0;
  while (deck.length > 0) {
    const card = deck.pop();
    if (!card) break;
    const target = game.players[idx % game.players.length];
    target.hand.push(card);
    idx += 1;
  }

  game.spadesBroken = false;
  game.bidIndex = 0;
  game.currentTrick = {
    leaderId: game.players[0].id,
    plays: [],
  };
  game.phase = "bidding";
  game.statusMessage = `Round ${game.roundNumber}: bidding`;
  return { ok: true };
}

export function placeBid(
  game: GameState,
  playerId: string,
  bid: number
): { ok: true } | { ok: false; error: string } {
  if (game.phase !== "bidding")
    return { ok: false, error: "Not in bidding phase" };
  const player = game.players[game.bidIndex];
  if (!player || player.id !== playerId)
    return { ok: false, error: "Not your turn to bid" };
  if (!Number.isInteger(bid) || bid < 0)
    return { ok: false, error: "Bid must be a whole number" };
  if (bid > player.hand.length)
    return { ok: false, error: "Bid cannot exceed hand size" };

  player.bid = bid;
  game.bidIndex += 1;

  if (game.bidIndex >= game.players.length) {
    game.phase = "playing";
    game.statusMessage = `Round ${game.roundNumber}: playing`;
  }
  return { ok: true };
}

export function playCard(
  game: GameState,
  playerId: string,
  cardId: string
): { ok: true } | { ok: false; error: string } {
  if (game.phase !== "playing" || !game.currentTrick)
    return { ok: false, error: "Not in play phase" };
  const expected = getCurrentTurn(game);
  if (expected !== playerId)
    return { ok: false, error: "Not your turn to play" };

  const player = game.players.find((p) => p.id === playerId);
  if (!player) return { ok: false, error: "Player not found" };
  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return { ok: false, error: "Card not in hand" };
  const card = player.hand[cardIndex];

  const leadSuit =
    game.currentTrick.leadSuit ?? game.currentTrick.plays[0]?.card.suit;
  const hasLeadSuit = leadSuit
    ? player.hand.some((c) => c.suit === leadSuit)
    : false;

  if (leadSuit && card.suit !== leadSuit && hasLeadSuit) {
    return { ok: false, error: `Must follow suit: ${leadSuit}` };
  }

  const hasNonSpades = player.hand.some((c) => c.suit !== "spades");
  if (
    !leadSuit &&
    card.suit === "spades" &&
    !game.spadesBroken &&
    hasNonSpades
  ) {
    return { ok: false, error: "Spades are not broken yet" };
  }

  player.hand.splice(cardIndex, 1);
  game.currentTrick.plays.push({ playerId, card });
  if (!game.currentTrick.leadSuit) {
    game.currentTrick.leadSuit = card.suit;
  }
  if (card.suit === "spades") {
    game.spadesBroken = true;
  }

  if (game.currentTrick.plays.length === game.players.length) {
    const winnerId = determineTrickWinner(game.currentTrick);
    const winner = game.players.find((p) => p.id === winnerId);
    if (winner) {
      winner.tricks += 1;
      game.statusMessage = `${winner.name} won the trick`;
    }

    const handsEmpty = game.players.every((p) => p.hand.length === 0);
    if (handsEmpty) {
      scoreRound(game);
      return { ok: true };
    }

    game.currentTrick = {
      leaderId: winnerId,
      plays: [],
    };
  }

  return { ok: true };
}

export function startNextRound(
  game: GameState
): { ok: true } | { ok: false; error: string } {
  if (game.phase !== "round_end" && game.phase !== "lobby") {
    return { ok: false, error: "Cannot start a new round yet" };
  }
  return startRound(game);
}

export function removePlayer(game: GameState, playerId: string): void {
  const idx = game.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return;
  game.players.splice(idx, 1);
  if (game.hostId === playerId && game.players[0]) {
    game.hostId = game.players[0].id;
    game.players[0].isHost = true;
  }

  if (game.players.length === 0) {
    return;
  }

  if (game.phase !== "lobby") {
    for (const player of game.players) {
      player.hand = [];
      player.bid = undefined;
      player.tricks = 0;
    }
    game.phase = "lobby";
    game.currentTrick = undefined;
    game.spadesBroken = false;
    game.bidIndex = 0;
    game.statusMessage = "A player left. Returning to lobby.";
  }
}

