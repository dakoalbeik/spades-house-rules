import { randomUUID } from "crypto";
import type {
  Card,
  CurrentTrick,
  GameOptions,
  GamePhase,
  GameState,
  PlayerState,
  Rank,
  SerializedGame,
  Suit,
  PlayerId,
} from "shared";
import { CardId, GameId } from "shared/dist/game";

const DEFAULT_STATUS: "active" = "active";

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

export function generateGameId(): GameId {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("") as GameId;
}

function generateCardId(deckIndex: number, rank: Rank, suit: Suit): CardId {
  return `${deckIndex}-${rank}-${suit}-${randomUUID().slice(0, 8)}` as CardId;
}

function buildDeck(numDecks: number): Card[] {
  const cards: Card[] = [];
  for (let deckIndex = 0; deckIndex < numDecks; deckIndex += 1) {
    for (const suit of suits) {
      for (const rank of ranks) {
        cards.push({
          id: generateCardId(deckIndex, rank, suit),
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

function getPlayOrder(game: GameState): PlayerId[] {
  if (!game.currentTrick) return [];
  const leaderIndex = game.players.findIndex(
    (p) => p.playerId === game.currentTrick?.leaderId,
  );
  if (leaderIndex === -1) return game.players.map((p) => p.playerId);

  const ordered: PlayerId[] = [];
  for (let i = 0; i < game.players.length; i += 1) {
    const idx = (leaderIndex + i) % game.players.length;
    ordered.push(game.players[idx].playerId);
  }
  return ordered;
}

export function getCurrentTurn(game: GameState): PlayerId | null {
  if (game.phase === "bidding") {
    return game.players[game.bidIndex]?.playerId ?? null;
  }
  if (game.phase === "playing" && game.currentTrick) {
    const order = getPlayOrder(game);
    return order[game.currentTrick.plays.length] ?? null;
  }
  return null;
}

function determineTrickWinner(trick: CurrentTrick): PlayerId {
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
  viewerId: string,
): SerializedGame {
  const viewer = game.players.find((p) => p.id === viewerId);
  const currentTurn = getCurrentTurn(game);
  const viewerIndex = game.players.findIndex((p) => p.id === viewerId);
  const orderedPlayers = game.players
    .slice(viewerIndex)
    .concat(game.players.slice(0, viewerIndex));
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
    players: orderedPlayers.map((p) => ({
      id: p.id,
      playerId: p.playerId,
      name: p.name,
      score: p.score,
      tricks: p.tricks,
      bid: p.bid,
      cardCount: p.hand.length,
      isHost: p.isHost,
      isSelf: p.id === viewerId,
      status: p.status ?? DEFAULT_STATUS,
    })),
  };
}

export function newPlayerId(): PlayerId {
  return randomUUID() as PlayerId;
}

export function createGame(
  hostId: string,
  hostName: string,
  options: GameOptions,
): GameState {
  const playerId = newPlayerId();
  return {
    id: generateGameId(),
    hostId: playerId,
    options,
    players: [
      {
        id: hostId,
        playerId,
        name: hostName,
        hand: [],
        tricks: 0,
        score: 0,
        isHost: true,
        status: DEFAULT_STATUS,
      },
    ],
    phase: "lobby",
    currentTrick: undefined,
    spadesBroken: false,
    bidIndex: 0,
    roundNumber: 0,
    statusMessage: "Waiting for players...",
    createdAt: Date.now(),
  };
}

function countActivePlayers(game: GameState): number {
  return game.players.filter((p) => (p.status ?? "active") === "active").length;
}

export function startRound(
  game: GameState,
): { ok: true } | { ok: false; error: string } {
  if (countActivePlayers(game) < MIN_PLAYERS) {
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
    leaderId: game.players[0].playerId,
    plays: [],
  };
  game.phase = "bidding";
  game.statusMessage = `Round ${game.roundNumber}: bidding`;
  return { ok: true };
}

export function placeBid(
  game: GameState,
  playerId: string,
  bid: number,
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
  socketId: string,
  cardId: string,
): { ok: true; trickComplete: boolean } | { ok: false; error: string } {
  if (game.phase !== "playing" || !game.currentTrick)
    return { ok: false, error: "Not in play phase" };

  const player = game.players.find((p) => p.id === socketId);
  if (!player) return { ok: false, error: "Player not found" };

  const expected = getCurrentTurn(game);
  if (expected !== player.playerId)
    return { ok: false, error: "Not your turn to play" };

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
  game.currentTrick.plays.push({ playerId: player.playerId, card });
  if (!game.currentTrick.leadSuit) {
    game.currentTrick.leadSuit = card.suit;
  }
  if (card.suit === "spades") {
    game.spadesBroken = true;
  }

  const trickComplete =
    game.currentTrick.plays.length === game.players.length;
  return { ok: true, trickComplete };
}

/** Resolve the completed trick: award it, then start the next trick or score the round. */
export function finalizeTrick(game: GameState): void {
  if (!game.currentTrick || game.currentTrick.plays.length === 0) return;
  const winnerId = determineTrickWinner(game.currentTrick);
  const winner = game.players.find((p) => p.playerId === winnerId);
  if (winner) {
    winner.tricks += 1;
    game.statusMessage = `${winner.name} won the trick`;
  }
  const handsEmpty = game.players.every((p) => p.hand.length === 0);
  if (handsEmpty) {
    scoreRound(game);
    return;
  }
  game.currentTrick = { leaderId: winnerId, plays: [] };
}

export function startNextRound(
  game: GameState,
): { ok: true } | { ok: false; error: string } {
  if (game.phase !== "round_end" && game.phase !== "lobby") {
    return { ok: false, error: "Cannot start a new round yet" };
  }
  return startRound(game);
}

/** Mark a player as left (disconnected) but keep them in the game so they can rejoin. */
export function setPlayerLeft(game: GameState, socketId: string): void {
  const player = game.players.find((p) => p.id === socketId);
  if (!player) return;
  player.status = "left";
  player.id = "";

  if (player.isHost) {
    const nextHost =
      game.players.find((p) => p.status === "active" && p.id) ??
      game.players[0];
    if (nextHost && nextHost !== player) {
      game.hostId = nextHost.playerId;
      nextHost.isHost = true;
      player.isHost = false;
    }
  }
}

/** Place a bid for whoever is currently up (used for left players). */
function placeBidForCurrentBidder(
  game: GameState,
  bid: number,
): { ok: true } | { ok: false; error: string } {
  if (game.phase !== "bidding")
    return { ok: false, error: "Not in bidding phase" };
  const player = game.players[game.bidIndex];
  if (!player) return { ok: false, error: "No current bidder" };
  if (!Number.isInteger(bid) || bid < 0)
    return { ok: false, error: "Invalid bid" };
  if (bid > player.hand.length)
    return { ok: false, error: "Bid exceeds hand size" };

  player.bid = bid;
  game.bidIndex += 1;
  if (game.bidIndex >= game.players.length) {
    game.phase = "playing";
    game.statusMessage = `Round ${game.roundNumber}: playing`;
  }
  return { ok: true };
}

/** Get the first legal card id for a player in the current trick (for auto-play). */
function getLegalCardIds(game: GameState, player: PlayerState): string[] {
  if (!game.currentTrick || game.phase !== "playing") return [];
  const leadSuit =
    game.currentTrick.leadSuit ?? game.currentTrick.plays[0]?.card.suit;
  const hasLeadSuit = leadSuit
    ? player.hand.some((c) => c.suit === leadSuit)
    : false;
  const hasNonSpades = player.hand.some((c) => c.suit !== "spades");

  return player.hand
    .filter((c) => {
      if (leadSuit && hasLeadSuit && c.suit !== leadSuit) return false;
      if (
        !leadSuit &&
        c.suit === "spades" &&
        !game.spadesBroken &&
        hasNonSpades
      ) {
        return false;
      }
      return true;
    })
    .map((c) => c.id);
}

/** Play a card by stable playerId (used for left players). */
function playCardByPlayerId(
  game: GameState,
  stablePlayerId: PlayerId,
  cardId: string,
): { ok: true } | { ok: false; error: string } {
  if (game.phase !== "playing" || !game.currentTrick)
    return { ok: false, error: "Not in play phase" };
  const player = game.players.find((p) => p.playerId === stablePlayerId);
  if (!player) return { ok: false, error: "Player not found" };

  const expected = getCurrentTurn(game);
  if (expected !== player.playerId)
    return { ok: false, error: "Not their turn" };

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
    return { ok: false, error: "Spades not broken" };
  }

  player.hand.splice(cardIndex, 1);
  game.currentTrick.plays.push({ playerId: player.playerId, card });
  if (!game.currentTrick.leadSuit) {
    game.currentTrick.leadSuit = card.suit;
  }
  if (card.suit === "spades") {
    game.spadesBroken = true;
  }

  if (game.currentTrick.plays.length === game.players.length) {
    const winnerId = determineTrickWinner(game.currentTrick);
    const winner = game.players.find((p) => p.playerId === winnerId);
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

/** Advance the game past any left players (auto-bid 0 or auto-play first legal card). */
export function advanceLeftPlayers(game: GameState): void {
  for (;;) {
    const currentTurnId = getCurrentTurn(game);
    if (!currentTurnId) break;
    const player = game.players.find((p) => p.playerId === currentTurnId);
    if (!player || player.status !== "left") break;

    if (game.phase === "bidding") {
      const result = placeBidForCurrentBidder(game, 0);
      if (!result.ok) break;
      continue;
    }
    if (game.phase === "playing") {
      const legalIds = getLegalCardIds(game, player);
      const cardId = legalIds[0];
      if (!cardId) break;
      const result = playCardByPlayerId(game, player.playerId, cardId);
      if (!result.ok) break;
      continue;
    }
    break;
  }
}

export function removePlayer(game: GameState, socketId: string): void {
  const idx = game.players.findIndex((p) => p.id === socketId);
  if (idx === -1) return;
  const { playerId } = game.players[idx];
  game.players.splice(idx, 1);
  if (game.hostId === playerId && game.players[0]) {
    game.hostId = game.players[0].playerId;
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
