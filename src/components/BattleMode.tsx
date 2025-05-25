import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import BattleContentContainer from "@/components/battle/BattleContentContainer";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { SingleBattle, BattleType } from "@/hooks/battle/types";
import { PokemonProvider } from "@/contexts/PokemonContext";

const BattleMode = () => {
  console.log('[DEBUG BattleMode] Component rendering');
  
  const { allPokemon, isLoading, loadPokemon } = usePokemonLoader();
  
  // CRITICAL FIX: Completely stable state management to prevent cascade re-renders
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  const [emergencyResetPerformed, setEmergencyResetPerformed] = useState(false);

  // CRITICAL FIX: Ultra-stable battle type - never changes reference
  const getInitialBattleType = (): BattleType => {
    const stored = localStorage.getItem('pokemon-ranker-battle-type') as BattleType | null;
    const defaultType: BattleType = "pairs";
    if (!stored || (stored !== "pairs" && stored !== "triplets")) {
      localStorage.setItem('pokemon-ranker-battle-type', defaultType);
      return defaultType;
    }
    return stored;
  };
  
  const initialBattleType = useRef<BattleType>(getInitialBattleType());

  // CRITICAL FIX: Ultra-stable callback references - never change
  const stableSetBattlesCompleted = useRef(setBattlesCompleted);
  const stableSetBattleResults = useRef(setBattleResults);
  
  // Update refs when state setters change (they shouldn't, but safety)
  stableSetBattlesCompleted.current = setBattlesCompleted;
  stableSetBattleResults.current = setBattleResults;

  // CRITICAL FIX: Ultra-stable allPokemon with complete type data verification
  const stableAllPokemon = useMemo(() => {
    if (!allPokemon.length) return [];
    
    console.log('[DEBUG BattleMode] Processing Pokemon data for stability');
    
    // Verify type data integrity in source data
    const samplePokemon = allPokemon[0];
    console.log('[DEBUG BattleMode] Sample Pokemon types from source:', JSON.stringify(samplePokemon?.types));
    
    // Ensure each Pokemon has complete type information preserved
    const processedPokemon = allPokemon.map(pokemon => {
      const processedPokemon = {
        ...pokemon,
        // CRITICAL: Preserve original types structure completely
        types: pokemon.types || []
      };
      
      // Verify a few sample Pokemon have proper type data
      if (pokemon.id <= 3) {
        console.log(`[DEBUG BattleMode] Pokemon ${pokemon.name} (${pokemon.id}) types:`, JSON.stringify(pokemon.types));
      }
      
      return processedPokemon;
    });
    
    console.log(`[DEBUG BattleMode] Processed ${processedPokemon.length} Pokemon with stable references`);
    return processedPokemon;
  }, [allPokemon.length]); // Only depend on length to prevent reference changes

  const [loadingInitiated, setLoadingInitiated] = useState(false);
  const loaderInitiatedRef = useRef(false);
  const loadingFailedRef = useRef(false);
  const retryCountRef = useRef(0);

  // Emergency reset on mount - simplified
  useEffect(() => {
    if (emergencyResetPerformed) return;
    
    const performInitialReset = () => {
      const keysToRemember = [
        'pokemon-ranker-battle-type',
        'pokemon-active-tier',
        'pokemon-frozen-pokemon'
      ];
      
      const rememberedValues: Record<string, string | null> = {};
      keysToRemember.forEach(key => {
        rememberedValues[key] = localStorage.getItem(key);
      });
      
      const keysToRemove = [
        'pokemon-battle-recently-used',
        'pokemon-battle-last-battle',
        'pokemon-ranker-battle-history',
        'pokemon-battle-history',
        'pokemon-battle-tracking',
        'pokemon-battle-seen',
        'pokemon-battle-count'
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Restore remembered values
      Object.entries(rememberedValues).forEach(([key, value]) => {
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      });
      
      setEmergencyResetPerformed(true);
      console.log('[DEBUG BattleMode] Emergency reset completed');
    };
    
    const timer = setTimeout(performInitialReset, 200);
    return () => clearTimeout(timer);
  }, [emergencyResetPerformed]);
  
  // Simplified Pokemon loading
  useEffect(() => {
    const loadPokemonWithRetry = async () => {
      if (!loaderInitiatedRef.current || loadingFailedRef.current) {
        try {
          loaderInitiatedRef.current = true;
          setLoadingInitiated(true);
          loadingFailedRef.current = false;
          
          await loadPokemon(0, true);
          retryCountRef.current = 0;
        } catch (error) {
          console.error("❌ Failed to load Pokémon:", error);
          loadingFailedRef.current = true;
          retryCountRef.current += 1;
          
          if (retryCountRef.current < 3) {
            setTimeout(loadPokemonWithRetry, 2000);
          }
        }
      }
    };

    loadPokemonWithRetry();
  }, [loadPokemon]);

  // CRITICAL FIX: Completely stable callback wrappers
  const ultraStableSetBattlesCompleted = useCallback((value: React.SetStateAction<number>) => {
    stableSetBattlesCompleted.current(value);
  }, []); // Never changes

  const ultraStableSetBattleResults = useCallback((value: React.SetStateAction<SingleBattle[]>) => {
    stableSetBattleResults.current(value);
  }, []); // Never changes

  // Loading state
  if (isLoading || !stableAllPokemon.length) {
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p>Loading Pokémon data...</p>
          {retryCountRef.current > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Attempt {retryCountRef.current + 1}...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <PokemonProvider allPokemon={stableAllPokemon}>
      <div className="flex flex-col items-center w-full py-4 px-4 sm:px-6">
        <BattleContentContainer
          allPokemon={stableAllPokemon}
          initialBattleType={initialBattleType.current}
          initialSelectedGeneration={0}
          setBattlesCompleted={ultraStableSetBattlesCompleted}
          setBattleResults={ultraStableSetBattleResults}
        />
      </div>
    </PokemonProvider>
  );
};

export default BattleMode;
