
import React, { useEffect, useState } from "react";
import BattleContentContainer from "@/components/battle/BattleContentContainer";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";

const BattleMode = () => {
  const { allPokemon, isLoading, loadPokemon } = usePokemonLoader();

  useEffect(() => {
    loadPokemon(0, true);
  }, [loadPokemon]);

  if (isLoading || !allPokemon.length) {
    return <div>Loading Pokémon...</div>;
  }

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
