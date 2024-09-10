import { Card } from "../models/card";
import { HandValue } from "../models/hand-value";
import { Opponent } from "../models/opponent";
import { useGameStore } from "./game-state.service";
import { decideOpponentTurn, createOpponent, drawOpponentCard } from "./opponent.service";

export const rollForImposter = () => {
    return Math.floor(Math.random() * 6) + 1;
};

export const initializeOpponents = () => {
    // Lando, Bosnok, Kay, Pike Thug, Crimson Dawn Enforcer, and Qi'ra are the pool of opponents. Pick 3 at random
    const opponents = ['Lando', 'Bosnok', 'Kay', 'Pike Thug', 'Crimson Dawn Enforcer', 'Qi\'ra'];
    const selectedOpponents: Opponent[] = [];
    for(let i = 0; i < 3; i++){
        const index = Math.floor(Math.random() * opponents.length);
        const selected = opponents.splice(index, 1)[0];
        // Create the opponent and draw 2 cards for them
        const opp = createOpponent(selected);
        opp.hand = [drawOpponentCard('Blood'), drawOpponentCard('Sand')];
        selectedOpponents.push(opp);
    }
    useGameStore.setState({ opponents: selectedOpponents });
}

export const handlePlayerDrawFromDeck = (suit: 'Blood' | 'Sand') => {
    const { drawCard, currentTurn: turns } = useGameStore.getState();
    if(turns > 0){
        drawCard(suit);
        // Get the player hand after drawing a card
        const { playerHand } = useGameStore.getState();
        // Sort the playerHand by suit
        playerHand.sort((a, b) => a.suit.localeCompare(b.suit));
        console.log('Turns left: ' + turns);
    }
};

export const handleEndGame = (): string => {
    const { playerHand, opponents } = useGameStore.getState();
    const playerHandValue = determineHandValue(playerHand);
    const opponentResults = opponents.map(opponent => {
        const handValue = determineHandValue(opponent.hand);
        const opponentValue = Math.abs(handValue.sandCard.value - handValue.bloodCard.value);
        return {
            name: opponent.name,
            value: opponentValue,
            hand: opponent.hand,
        };
    });

    const playerValue = Math.abs(playerHandValue.sandCard.value - playerHandValue.bloodCard.value);
    const playerResults = {
        name: 'You',
        value: playerValue,
        hand: playerHand,
    };

    // Return the name of the winner - determined by the lowest value
    // Pure Sabacc > Prime Sabacc > Sabacc > Smallest difference between cards
    // There can be multiple winners
    const allResults = [playerResults, ...opponentResults];

    const pureSabaccWinners = allResults.filter(result => result.hand.every(card => card.value === 'Sylop'));
    if(pureSabaccWinners.length > 0){
        return pureSabaccWinners.map(winner => winner.name).join(', ') + ' wins with a Pure Sabacc!';
    }

    const primeSabaccWinners = allResults.filter(result => result.hand.every(card => card.value === 1));
    if(primeSabaccWinners.length > 0){
        return primeSabaccWinners.map(winner => winner.name).join(', ') + ' wins with a Prime Sabacc!';
    }

    const sabaccWinners = allResults.filter(result => result.hand[0].value === result.hand[1].value);
    if(sabaccWinners.length > 0){
        return sabaccWinners.map(winner => winner.name).join(', ') + ' wins with a Sabacc!';
    }

    const smallestDifference = Math.min(...allResults.map(result => result.value));
    const winners = allResults.filter(result => result.value === smallestDifference);
    return winners.map(winner => winner.name).join(', ') + ' wins with a value of ' + smallestDifference;
};

export const handlePlayerDiscard = (index: number) => {
    const { discardCard } = useGameStore.getState();
    discardCard(index);
}

export const handlePlayerEndTurn = () => {
    const {opponents, currentTurn} = useGameStore.getState();
    console.log('Ending player turn');
    opponents.forEach(async opponent => {
        useGameStore.setState({ currentPlayerTurn: opponent.name });
        console.log('==============================');
        console.log('Opponent ' + opponent.name);
        // If they have a winning hand, pass
        const handValue = determineHandValue(opponent.hand);
        if(handValue.primeSabacc || handValue.pureSabacc || handValue.sabacc){
            console.log(opponent.name + ' is passing');
            return; // This opponent has a winning hand and will not draw a card
        }
        // otherwise, draw a card to replace the highest card
        decideOpponentTurn(opponent);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds to simulate thinking
    });
    useGameStore.setState({ currentTurn: currentTurn + 1 });
};

export const determineHandValue = (hand: Card[]): HandValue => {
    // Pure Sabacc = two Sylop cards
    // Prime Sabacc = two 1s
    // Sabacc = two cards of the same value
    // Anything else is positive points by subtracting smallest from largest value

    const [card1, card2] = hand;
    const sand = card1.suit === 'Sand' ? card1 : card2;
    const blood = card1.suit === 'Blood' ? card1 : card2;
    const sandImposterValue = sand.value === 'Imposter' ? rollForImposter() : 0;
    const bloodImposterValue = blood.value === 'Imposter' ? rollForImposter() : 0;
    const pureSabacc = sand.value === 'Sylop' && blood.value === 'Sylop';
    const primeSabacc = sand.value === 1 && blood.value === 1;
    const sabacc = sand.value === blood.value;
    // Convert the cards to EndGameCard type
    // Sylop cards get the value of the other card. If both are Sylop, they are both 0
    // Imposter cards get the value rolled above
    // Other cards get their face value

    let sandCardValue: number = 0;
    let bloodCardValue: number= 0;

    if(sand.value === 'Sylop' && blood.value === 'Sylop'){
        sandCardValue = 0;
        bloodCardValue = 0;
    }
    else if(sand.value === 'Sylop' && blood.value === 'Imposter'){
        sandCardValue = bloodCardValue = bloodImposterValue;
    }
    else if(sand.value === 'Imposter' && blood.value === 'Sylop'){
        sandCardValue = bloodCardValue = sandImposterValue;
    }
    
    else if(blood.value === 'Sylop' && sand.value === 'Imposter'){
        sandCardValue = bloodCardValue = bloodImposterValue;
    }
    else if(blood.value === 'Imposter' && sand.value === 'Sylop'){
        sandCardValue = bloodCardValue = sandImposterValue;
    }
    else if(sand.value === 'Imposter' && blood.value === 'Imposter'){
        sandCardValue = sandImposterValue;
        bloodCardValue = bloodImposterValue;
    }
    else{
        sandCardValue = isNaN(Number(sand.value)) ? 0 : Number(sand.value);
        bloodCardValue = isNaN(Number(blood.value)) ? 0 : Number(blood.value);
    }

    const sandCard = {
        value: sandCardValue,
        suit: sand.suit,
        isImposter: sand.value === 'Imposter'
    }

    const bloodCard = {
        value: bloodCardValue,
        suit: blood.suit,
        isImposter: blood.value === 'Imposter'
    }

    console.log('+++++++Determining hand value+++++++');
    console.log('Sand Card: ' + JSON.stringify(sandCard));
    console.log('Blood Card: ' + JSON.stringify(bloodCard));
    console.log('++++++++++++++++++++++++++++++++++++');

    return {
        sandCard,
        bloodCard,
        sandImposterValue,
        bloodImposterValue,
        pureSabacc,
        primeSabacc,
        sabacc,
    };
}