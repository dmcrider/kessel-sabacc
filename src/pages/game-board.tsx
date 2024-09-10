import { useEffect, useState } from "react";
import { handleEndGame, handlePlayerDrawFromDeck, handlePlayerEndTurn, initializeOpponents, useGameStore } from "../services";
import { appWindow } from "@tauri-apps/api/window";


export const GameBoard = () => {
    const { playerHand, currentTurn, maxTurns, opponents, currentPlayerTurn, resetGame, discardCard } = useGameStore();
    const [gameResults, setGameResults] = useState<string | null>(null);
    const [isOpponentsTurn, setIsOpponentsTurn] = useState(false);

    const restartGame = () => {
        console.log('Restarting game...');
        setGameResults(null);
        resetGame();
        handlePlayerDrawFromDeck('Blood');
        handlePlayerDrawFromDeck('Sand');
        initializeOpponents();
        useGameStore.setState({ maxTurns: 3, currentTurn: 1 });
        console.log('New game started');
        console.log(JSON.stringify(useGameStore.getState()));
    }

    const nextTurn = () => {
        setIsOpponentsTurn(true);
        handlePlayerEndTurn();
        setIsOpponentsTurn(false);
    }

    useEffect(() => {
        if (currentTurn >= maxTurns) {
            const winner = handleEndGame();
            setGameResults(winner);
        }
    }, [currentTurn]);

    useEffect(() => {
        let unlisten: (() => void) | null = null;
        const setupCloseListener = async () => {
            unlisten = await appWindow.onCloseRequested(() => {
                localStorage.clear();
                console.log('Game data cleared');
            });
        };
        setupCloseListener();
        console.log('Initializing game...');
        const gameInitialized = localStorage.getItem('gameInitialized') === 'true';
        if(!gameInitialized){
            restartGame();
            localStorage.setItem('gameInitialized', 'true');
        }
        return () => {
            if(unlisten){
                unlisten();
            }
        };
    }, []);

    return (
        <div>
            <h1>Kessel Sabacc Game</h1>
            <h2>Your Hand</h2>
            <h4>Turn {currentTurn + 1} of {maxTurns}</h4>
            <div>
                At the table: You, {opponents.map((opponent) => opponent.name).join(', ')}
            </div>
            {isOpponentsTurn && (
                <h3>It's {currentPlayerTurn}'s turn</h3>
            )}
            {!isOpponentsTurn && (
                <h3>It's your turn</h3>
            )}
            <div>
                {playerHand.map((card, index) => (
                    <div key={index} className={card.suit.toLowerCase() + " kessel-card d-flex justify-content-around"}>
                        {card.value}
                        {playerHand.filter(c => c.suit === card.suit).length > 1 &&(
                            <button className="btn btn-basic btn-discard" onClick={() => discardCard(index)}>Discard</button>
                        )}
                    </div>
                ))}
            </div>
            {gameResults && (
                <h2>Final Results: {gameResults}</h2>
            )}
            {playerHand.length <= 2 && !isOpponentsTurn && (
                <div>
                    <button className="btn btn-basic blood" onClick={() => handlePlayerDrawFromDeck('Blood')}>
                        Draw Blood Card
                    </button>
                    <button className="btn btn-basic sand" onClick={() => handlePlayerDrawFromDeck('Sand')}>
                        Draw Sand Card
                    </button>
                    <button className="btn btn-basic" onClick={() => nextTurn()}>
                        Pass/End Turn
                    </button>
                </div>
            )}
            <button className="btn btn-basic" onClick={() => {
                const finalValue = handleEndGame();
                setGameResults(finalValue); // update the finalValue state
            }} disabled={gameResults !== null}>
                End Game
            </button>
            <button className="btn btn-basic" onClick={() => {
                restartGame();
            }} disabled={gameResults === null}>
                Play Again
            </button>
        </div>
    );
};