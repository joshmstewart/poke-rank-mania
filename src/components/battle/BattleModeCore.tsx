import React, { useState, useRef, useEffect, useCallback } from "react";
import BattleModeProvider from "./BattleModeProvider";
import BattleModeContainer from "./BattleModeContainer";
import BattleModeLoader from "./BattleModeLoader";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";

const BattleModeCore: React.FC = () => {
  console.log('🔥 BattleModeCore: Component rendering');
  
  const [stablePokemon, setStablePokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  
  const initialBattleType: BattleType = "pairs";
  
  // Use refs to prevent unnecessary re-renders
  const stableSetBattlesCompleted = useRef(setBattlesCompleted);
  const stableSetBattleResults = useRef(setBattleResults);
  
  // Keep refs up to date
  stableSetBattlesCompleted.current = setBattlesCompleted;
  stableSetBattleResults.current = setBattleResults;

  const handlePokemonLoaded = useCallback((pokemon: Pokemon[]) => {
    console.log(`🔒 [POKEMON_LOADING_FIX] BattleModeCore received ${pokemon.length} Pokemon from loader`);
    setStablePokemon(pokemon);
  }, []);

  const handleLoadingChange = useCallback((loading: boolean) => {
    console.log(`🔒 [POKEMON_LOADING_FIX] BattleModeCore loading state changed to: ${loading}`);
    setIsLoading(loading);
  }, []);

  // Loading state
  if (isLoading || !stablePokemon.length) {
    console.log(`🔒 [POKEMON_LOADING_FIX] BattleModeCore showing loading state - isLoading: ${isLoading}, Pokemon count: ${stablePokemon.length}`);
    
    return (
      <>
        <BattleModeLoader
          onPokemonLoaded={handlePokemonLoaded}
          onLoadingChange={handleLoadingChange}
        />
        <div className="flex justify-center items-center h-64 w-full">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
            <p>Loading complete Pokémon dataset for battles...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BattleModeLoader
        onPokemonLoaded={handlePokemonLoaded}
        onLoadingChange={handleLoadingChange}
      />
      <BattleModeProvider allPokemon={stablePokemon}>
        <BattleModeContainer
          allPokemon={stablePokemon}
          initialBattleType={initialBattleType}
          setBattlesCompleted={stableSetBattlesCompleted.current}
          setBattleResults={stableSetBattleResults.current}
        />
      </BattleModeProvider>
    </>
  );
};

export default BattleModeCore;
