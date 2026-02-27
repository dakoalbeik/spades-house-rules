import type { Card, Rank, Suit } from "../types";

export const rankValue: Record<Rank, number> = {
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

export const suitOrder: Suit[] = ["spades", "hearts", "diamonds", "clubs"];

export const formatCard = (card: Card): string =>
  `${card.rank} ${
    card.suit === "spades"
      ? "♠"
      : card.suit === "hearts"
      ? "♥"
      : card.suit === "diamonds"
      ? "♦"
      : "♣"
  }`;

export const getCardImagePath = (card: Card): string => {
  const suit = card.suit;
  const rank = card.rank.toLowerCase();

  // Map rank to filename format
  let rankName = rank;
  if (rank === "j") rankName = "jack";
  else if (rank === "q") rankName = "queen";
  else if (rank === "k") rankName = "king";
  else if (rank === "a") rankName = "ace";

  // Images are in public/cards folder - Vite serves public folder at root
  const filename = `${rankName}_of_${suit}.png`;
  return `/cards/${filename}`;
};

export const sortCards = (cards: Card[]): Card[] => {
  return cards
    .slice()
    .sort(
      (a, b) =>
        suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit) ||
        rankValue[a.rank] - rankValue[b.rank]
    );
};
