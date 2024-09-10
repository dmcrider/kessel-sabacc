import { Card } from "../models/card";

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (let i = 1; i <= 6; i++) {
    deck.push({ suit: "Blood", value: i });
    deck.push({ suit: "Sand", value: i });
  }
  deck.push({ suit: "Blood", value: "Imposter" });
  deck.push({ suit: "Sand", value: "Imposter" });
  deck.push({ suit: "Blood", value: "Sylop" });
  deck.push({ suit: "Sand", value: "Sylop" });
  return deck;
};
