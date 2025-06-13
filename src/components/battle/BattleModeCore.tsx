
import React, { useState, useRef, useEffect, useCallback } from "react";
import BattleModeProvider from "./BattleModeProvider";
import BattleModeContainer from "./BattleModeContainer";
import BattleModeLoader from "./BattleModeLoader";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";
import { LoadingProgress } from "@/components/ui/LoadingProgress";

const BattleModeCore: React.FC = () => {
  console.log('🔥 BattleModeCore: Component rendering with progressive loading');
  
  const { 
    allPokemon, 
    isLoading, 
    isBackgroundLoading, 
    backgroundProgress,
    hasEssentialData 
  } = usePokemonLoader();
  
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  
  const initialBattleType: BattleType = "pairs";
  
  // Use refs to prevent unnecessary re-renders
  const stableSetBattlesCompleted = useRef(setBattlesCompleted);
  const stableSetBattleResults = useRef(setBattleResults);
  
  // Keep refs up to date
  stableSetBattlesCompleted.current = setBattlesCompleted;
  stableSetBattleResults.current = setBattleResults;

  // Show app immediately with essential Pokemon, background load the rest
  if (allPokemon.length > 0 || hasEssentialData) {
    console.log(`✅ [BATTLE_MODE_CORE] Pokemon ready: ${allPokemon.length}, showing app with progressive loading`);
    
    return (
      <>
        <BattleModeProvider allPokemon={allPokemon}>
          <BattleModeContainer
            allPokemon={allPokemon}
            initialBattleType={initialBattleType}
            setBattlesCompleted={stableSetBattlesCompleted.current}
            setBattleResults={stableSetBattleResults.current}
          />
        </BattleModeProvider>
        
        {/* Show background loading progress */}
        <LoadingProgress 
          isVisible={isBackgroundLoading && allPokemon.length > 0}
          progress={backgroundProgress}
          message="Loading additional Pokemon in background..."
        />
      </>
    );
  }

  // Only show loading if we're actually loading and don't have any Pokemon yet
  if (isLoading) {
    console.log(`🔒 [BATTLE_MODE_CORE] Still loading essential Pokemon, showing loading state`);
    
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p>Loading essential Pokémon for battles...</p>
          <p className="text-sm text-gray-500 mt-2">First-time setup may take a moment</p>
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
