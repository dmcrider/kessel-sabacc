import { EndGameCard } from "./end-game-card";

export type HandValue ={
    sandCard: EndGameCard;
    bloodCard: EndGameCard;
    sandImposterValue: number;
    bloodImposterValue: number;
    pureSabacc: boolean;
    primeSabacc: boolean;
    sabacc: boolean;
}