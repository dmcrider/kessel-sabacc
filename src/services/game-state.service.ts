import { create } from "zustand";
import { GameState } from "../models/game-state";
import { createDeck } from "./deck.service";

export const useGameStore = create<GameState>(
    (set) => ({
        deck: createDeck(),
        playerHand: [],
        maxTurns: 3,
        currentTurn: 0,
        opponents: [],
        currentPlayerTurn: 'You',
        drawCard: (suit: 'Blood' | 'Sand') => set((state) => {
            const suitDeck = state.deck.filter(card => card.suit === suit);
            const newCard = suitDeck[Math.floor(Math.random() * suitDeck.length)];
            console.log('New Card: ' + JSON.stringify(newCard));
            const newDeck = state.deck.filter(card => card !== newCard);
            return {
                ...state,
                playerHand: [...state.playerHand, newCard],
                deck: newDeck,
            }
        }),
        resetGame: () => set(() => ({
            deck: createDeck(),
            playerHand: [],
            maxTurns: 3,
            currentTurn: 0,
            opponents: [],
            }),
        ),
        discardCard: (index: number) => set((state) => {
            const newHand = [...state.playerHand];
            newHand.splice(index, 1);
            return {
                ...state,
                playerHand: newHand,
            }
        })
    })
);