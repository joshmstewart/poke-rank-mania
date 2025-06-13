import React, { useState, useRef, useEffect, useCallback } from "react";
import BattleModeProvider from "./BattleModeProvider";
import BattleModeContainer from "./BattleModeContainer";
import BattleModeLoader from "./BattleModeLoader";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";

const BattleModeCore: React.FC = () => {
  console.log('🔥 BattleModeCore: Component rendering');
  
  const { allPokemon, isLoading } = usePokemonLoader();
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  
  const initialBattleType: BattleType = "pairs";
  
  // Use refs to prevent unnecessary re-renders
  const stableSetBattlesCompleted = useRef(setBattlesCompleted);
  const stableSetBattleResults = useRef(setBattleResults);
  
  // Keep refs up to date
  stableSetBattlesCompleted.current = setBattlesCompleted;
  stableSetBattleResults.current = setBattleResults;

  // If Pokemon are already loaded (from splash), show the app immediately
  if (allPokemon.length > 0) {
    console.log(`✅ [BATTLE_MODE_CORE] Pokemon already loaded: ${allPokemon.length}, showing app immediately`);
    
    return (
      <BattleModeProvider allPokemon={allPokemon}>
        <BattleModeContainer
          allPokemon={allPokemon}
          initialBattleType={initialBattleType}
          setBattlesCompleted={stableSetBattlesCompleted.current}
          setBattleResults={stableSetBattleResults.current}
        />
      </BattleModeProvider>
    );
  }

  // Only show loading if we're actually loading and don't have Pokemon yet
  if (isLoading) {
    console.log(`🔒 [BATTLE_MODE_CORE] Still loading Pokemon, showing loading state`);
    
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p>Loading complete Pokémon dataset for battles...</p>
        </div>
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className="flex justify-center items-center h-64 w-full">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
        <p>Preparing battle mode...</p>
      </div>
    </div>
  );
};

export default BattleModeCore;
