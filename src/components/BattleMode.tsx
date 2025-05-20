import React from "react";
import BattleContentContainer from "./battle/BattleContentContainer";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";

const BattleMode = () => {
  const allPokemon = usePokemonLoader();

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-4xl">
        <BattleContentContainer
          allPokemon={allPokemon}
          initialBattleType="pairs"
          initialSelectedGeneration={0}
        />
      </div>
    </div>
  );
};

export default BattleMode;
