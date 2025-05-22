
import React from "react";
import BattleContent from "./BattleContent";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";

import { SingleBattle } from "@/hooks/battle/types"; // ⬅️ Add this import if not present

interface BattleContentContainerProps {
  allPokemon: Pokemon[];
  initialSelectedGeneration: number;
  initialBattleType: BattleType;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
}


const BattleContentContainer: React.FC<BattleContentContainerProps> = ({
  allPokemon,
  initialBattleType = "pairs",
  initialSelectedGeneration = 0,
  setBattlesCompleted,
  setBattleResults
}) => {

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4">
     <BattleContent
  allPokemon={allPokemon}
  initialBattleType={initialBattleType}
  initialSelectedGeneration={initialSelectedGeneration}
  setBattlesCompleted={setBattlesCompleted}
  setBattleResults={setBattleResults}
/>

    </div>
  );
};

export default BattleContentContainer;
