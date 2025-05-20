import React from "react";
import BattleContentContainer from "./battle/BattleContentContainer";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";

const BattleMode: React.FC = () => {
  const allPokemon = usePokemonLoader(0); // Load all generations by default

  return (
    <div className="flex flex-col">
      <BattleContentContainer 
        allPokemon={allPokemon} 
        initialBattleType="pairs" 
        initialSelectedGeneration={0}
      />
    </div>
  );
};

export default BattleMode;
