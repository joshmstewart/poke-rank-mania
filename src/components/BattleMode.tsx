
import React, { useEffect, useState } from "react";
import BattleContentContainer from "@/components/battle/BattleContentContainer";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";

const BattleMode = () => {
  const { allPokemon, isLoading, loadPokemon } = usePokemonLoader();
  const [loadingInitiated, setLoadingInitiated] = useState(false);

  useEffect(() => {
    if (!loadingInitiated) {
      setLoadingInitiated(true);
      loadPokemon(0, true);
    }
  }, [loadPokemon, loadingInitiated]);

  if (isLoading || !allPokemon.length) {
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p>Loading Pokémon data...</p>
        </div>
      </div>
    );
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
