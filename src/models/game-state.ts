import { Card } from "./card"
import { Opponent } from "./opponent";

export type GameState = {
    deck: Card[];
    playerHand: Card[];
    currentTurn: number;
    maxTurns: number;
    opponents: Opponent[];
    currentPlayerTurn: string;
    drawCard: (suit: 'Blood' | 'Sand') => void;
    resetGame: () => void;
    discardCard: (index: number) => void;
}