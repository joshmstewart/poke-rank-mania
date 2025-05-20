
import React from "react";
import BattleContent from "./BattleContent";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";

interface BattleContentContainerProps {
  allPokemon: Pokemon[];
  initialBattleType?: BattleType;
  initialSelectedGeneration?: number;
}

const BattleContentContainer: React.FC<BattleContentContainerProps> = ({
  allPokemon,
  initialBattleType = "pairs",
  initialSelectedGeneration = 0
}) => {
  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4">
      <BattleContent
        allPokemon={allPokemon}
        initialBattleType={initialBattleType}
        initialSelectedGeneration={initialSelectedGeneration}
      />
    </div>
  );
};

export default BattleContentContainer;
