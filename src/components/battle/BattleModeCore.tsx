
import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import BattleModeLoader from "./BattleModeLoader";
import BattleModeProvider from "./BattleModeProvider";
import BattleModeContainer from "./BattleModeContainer";
import { RefinementQueueProvider } from "./RefinementQueueProvider";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { useBattleDebugger } from "@/hooks/battle/useBattleDebugger";

const BattleModeCore: React.FC = () => {
  console.log('[DEBUG BattleModeCore] Component rendering');
  console.log(`🔄 [REFINEMENT_PROVIDER_TOP_LEVEL] Wrapping entire BattleMode with single RefinementQueueProvider`);
  
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  const { totalBattles, isHydrated, waitForHydration, loadFromCloud } = useTrueSkillStore();

  // Add debug monitoring
  const { manualDebugCheck } = useBattleDebugger();

  // Expose debug function globally for easy access
  useEffect(() => {
    (window as any).debugBattleState = manualDebugCheck;
    console.log('🔍 [DEBUG_SETUP] You can run window.debugBattleState() in console to check localStorage');
  }, [manualDebugCheck]);

  const getInitialBattleType = (): BattleType => {
    const stored = localStorage.getItem('pokemon-ranker-battle-type') as BattleType | null;
    const defaultType: BattleType = "pairs";
    if (!stored || (stored !== "pairs" && stored !== "triplets")) {
      localStorage.setItem('pokemon-ranker-battle-type', defaultType);
      return defaultType;
    }
    return stored;
  };
  
  const initialBattleType = useMemo(() => getInitialBattleType(), []);

  const stablePokemon = useMemo(() => {
    if (!allPokemon || allPokemon.length === 0) {
      return [];
    }
    
    console.log(`🔒 [POKEMON_LOADING_FIX] BattleModeCore using complete Pokemon dataset: ${allPokemon.length}`);
    return allPokemon;
  }, [allPokemon.length > 0 ? 'HAS_POKEMON' : 'NO_POKEMON']);

  const stableSetBattlesCompleted = useCallback((value: React.SetStateAction<number>) => {
    setBattlesCompleted(value);
  }, []);

  const stableSetBattleResults = useCallback((value: React.SetStateAction<SingleBattle[]>) => {
    setBattleResults(value);
  }, []);

  const handlePokemonLoaded = useCallback((pokemon: Pokemon[]) => {
    setAllPokemon(pokemon);
  }, []);

  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  // CRITICAL FIX: Enhanced initialization with forced cloud sync
  useEffect(() => {
    if (hasInitialized) return;
    
    const performEnhancedCloudInitialization = async () => {
      console.log(`🌥️ [ENHANCED_CLOUD_INIT] Performing enhanced cloud-first initialization`);
      
      try {
        if (!isHydrated) {
          console.log(`🌥️ [ENHANCED_CLOUD_INIT] Waiting for TrueSkill hydration...`);
          await waitForHydration();
        }
        
        console.log(`🌥️ [ENHANCED_CLOUD_INIT] Hydration complete, forcing cloud sync...`);
        
        // Force load from cloud to ensure we have latest data
        await loadFromCloud();
        
        // Get the final total battles count after cloud sync
        const finalTotalBattles = useTrueSkillStore.getState().totalBattles;
        console.log(`🌥️ [ENHANCED_CLOUD_INIT] ✅ Setting battle count from cloud: ${finalTotalBattles}`);
        setBattlesCompleted(finalTotalBattles);
        
        setHasInitialized(true);
        console.log('[DEBUG BattleModeCore] Enhanced cloud initialization completed');
        
      } catch (error) {
        console.error(`🌥️ [ENHANCED_CLOUD_INIT] ❌ Enhanced initialization failed:`, error);
        
        // Fallback to current hydrated state
        const fallbackCount = totalBattles;
        console.log(`🌥️ [ENHANCED_CLOUD_INIT] 🔄 Using fallback count: ${fallbackCount}`);
        setBattlesCompleted(fallbackCount);
        setHasInitialized(true);
      }
    };
    
    performEnhancedCloudInitialization();
  }, [hasInitialized, isHydrated, totalBattles, waitForHydration, loadFromCloud]);

  // Loading state
  if (isLoading || !stablePokemon.length) {
    console.log(`🔒 [POKEMON_LOADING_FIX] BattleModeCore showing loading state - isLoading: ${isLoading}, Pokemon count: ${stablePokemon.length}`);
    
    return (
      <RefinementQueueProvider>
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
      </RefinementQueueProvider>
    );
  }

  return (
    <RefinementQueueProvider>
      <BattleModeLoader
        onPokemonLoaded={handlePokemonLoaded}
        onLoadingChange={handleLoadingChange}
      />
      <BattleModeProvider allPokemon={stablePokemon}>
        <BattleModeContainer
          allPokemon={stablePokemon}
          initialBattleType={initialBattleType}
          setBattlesCompleted={stableSetBattlesCompleted}
          setBattleResults={stableSetBattleResults}
        />
      </BattleModeProvider>
    </RefinementQueueProvider>
  );
};

export default BattleModeCore;
