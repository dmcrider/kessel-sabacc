import { Card } from "../models/card";
import { Opponent } from "../models/opponent";
import { useGameStore } from "./game-state.service";

export const createOpponent = (name: string): Opponent => ({
    id: name,
    name,
    hand: [],
});

export const drawOpponentCard = (suit: 'Blood' | 'Sand'): Card => {
    const {deck} = useGameStore.getState();
    // Filter to only draw from the given suit
    const suitDeck = deck.filter(card => card.suit === suit);
    const newCard = suitDeck[Math.floor(Math.random() * suitDeck.length)];
    if(!newCard){
        throw new Error('No cards left in the deck: ' + JSON.stringify(deck));
    }
    console.log('New Opponent Card: ' + JSON.stringify(newCard));
    // Remove the new card from the deck
    const newDeck = deck.filter(card => card !== newCard);
    // Update the deck
    useGameStore.setState({ deck: newDeck });
    return newCard;
}

export const decideOpponentTurn = (opponent: Opponent): void => {
    console.log('Deciding opponent turn for ' + opponent.name);
    const oppIndex = useGameStore.getState().opponents.findIndex(opp => opp.id === opponent.id);
    const sylopCards = opponent.hand.filter(card => card.value === 'Sylop');
    const imposterCards = opponent.hand.filter(card => card.value === 'Imposter');
    
    // They cannot be in this method with 2 Sylop cards, so we don't need to check for that
    if(sylopCards.length === 1){
        // If they have one Sylop card, draw a card of the other suit
        const currentCard = opponent.hand.find(card => card.value !== 'Sylop')!;
        const newCard = drawOpponentCard(sylopCards[0].suit === 'Blood' ? 'Sand' : 'Blood');
        const keptCard = replaceHighestCard(currentCard, newCard);
        opponent.hand = [keptCard, sylopCards[0]];
        useGameStore.setState((state) => {
            const newOpponents = [...state.opponents];
            newOpponents[oppIndex] = opponent;
            return { opponents: newOpponents };
        });
        console.log(opponent.name + '\'s current hand[0]: ' + JSON.stringify(opponent.hand));
        return;
    }

    if(imposterCards.length === 1){
        // If the other card in the hand is a 4 or above, replace it. Otherwise replace the imposter card
        const otherCardInHand = opponent.hand.find(card => card.value !== 'Imposter')!;
        // This shouldn't be 0, because we know the other card isn't an Imposter, but just in case
        const otherCardValue = isNaN(Number(otherCardInHand.value)) ? 0 : Number(otherCardInHand.value);
        if(otherCardValue >= 4){
            const newCard = drawOpponentCard(otherCardInHand.suit);
            const keptCard = replaceHighestCard(otherCardInHand, newCard);
            opponent.hand = [keptCard, imposterCards[0]];
            useGameStore.setState((state) => {
                const newOpponents = [...state.opponents];
                newOpponents[oppIndex] = opponent;
                return { opponents: newOpponents };
            });
        }
        else{
            const newCard = drawOpponentCard(imposterCards[0].suit);
            const keptCard = replaceHighestCard(imposterCards[0], newCard);
            opponent.hand = [keptCard, otherCardInHand];
            useGameStore.setState((state) => {
                const newOpponents = [...state.opponents];
                newOpponents[oppIndex] = opponent;
                return { opponents: newOpponents };
            });
        }
        console.log(opponent.name + '\'s current hand[1]: ' + JSON.stringify(opponent.hand));
        return;
    }

    if(imposterCards.length === 2){
        // If they have two Imposter cards, draw a card for a random suit
        const newCard = drawOpponentCard(Math.random() < 0.5 ? 'Blood' : 'Sand');
        let keptImposterCard: Card;
        switch(newCard.suit){
            case 'Blood':
                keptImposterCard = imposterCards.find(card => card.suit === 'Sand')!;
                break;
            case 'Sand':
                keptImposterCard = imposterCards.find(card => card.suit === 'Blood')!;
                break;
        }
        opponent.hand = [newCard, keptImposterCard];
        useGameStore.setState((state) => {
            const newOpponents = [...state.opponents];
            newOpponents[oppIndex] = opponent;
            return { opponents: newOpponents };
        });
        console.log(opponent.name + '\'s current hand[2]: ' + JSON.stringify(opponent.hand));
    }

    // They do not have any Sylop or Imposter cards, so they will draw a card to replace the highest card in their hand
    const currentCard = opponent.hand.reduce((highestCard, card) => replaceHighestCard(highestCard, card));
    const newCard = drawOpponentCard(currentCard.suit);
    const keptCard = replaceHighestCard(currentCard, newCard);
    opponent.hand = opponent.hand.map(card => card === currentCard ? keptCard : card);
    useGameStore.setState((state) => {
        const newOpponents = [...state.opponents];
        newOpponents[oppIndex] = opponent;
        return { opponents: newOpponents };
    });
    console.log(opponent.name + '\'s current hand[3]: ' + JSON.stringify(opponent.hand));
}

const replaceHighestCard = (currentCard: Card, newCard: Card): Card => {
    // If either card is a Sylop, keep the Sylop
    if(currentCard.value === 'Sylop'){
        return newCard;
    }
    if(newCard.value === 'Sylop'){
        return currentCard;
    }
    // If either card is an Imposter, keep the Imposter if the other card is a 4 or above
    if(currentCard.value === 'Imposter'){
        // This will only be 0 if the newCard is also an Imposter
        const newCardValue = isNaN(Number(newCard.value)) ? 0 : Number(newCard.value);
        if(newCardValue >= 4){
            return currentCard;
        }
        // The new card is less than 4, so keep it (or they're both Imposters, in which case it doesn't matter)
        return newCard;
    }

    if(newCard.value === 'Imposter'){
        // This should never be 0, because all other conditions have been checked, but just in case
        const currentCardValue = isNaN(Number(currentCard.value)) ? 0 : Number(currentCard.value);
        if(currentCardValue >= 4){
            return newCard;
        }
        // The current card is less than 4, so keep it (or they're both Imposters, in which case it doesn't matter)
        return currentCard;
    }

    const currentValue = Number(currentCard.value);
    const newValue = Number(newCard.value);
    return currentValue < newValue ? currentCard : newCard;
}
