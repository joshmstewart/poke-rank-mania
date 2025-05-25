
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import BattleContentContainer from "@/components/battle/BattleContentContainer";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { SingleBattle, BattleType } from "@/hooks/battle/types";

const BattleMode = () => {
  console.log('[DEBUG BattleMode] Component rendering');
  
  const { allPokemon, isLoading, loadPokemon } = usePokemonLoader();
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  const [emergencyResetPerformed, setEmergencyResetPerformed] = useState(false);

  // PERFORMANCE FIX: Memoize the initial battle type to prevent re-calculations
  const initialBattleType = useMemo((): BattleType => {
    const stored = localStorage.getItem('pokemon-ranker-battle-type') as BattleType | null;
    const defaultType: BattleType = "pairs";
    if (!stored || (stored !== "pairs" && stored !== "triplets")) {
      localStorage.setItem('pokemon-ranker-battle-type', defaultType);
      return defaultType;
    }
    return stored;
  }, []);

  // PERFORMANCE FIX: Stable references to prevent unnecessary re-renders
  const stableBattlesCompleted = useRef(battlesCompleted);
  const stableBattleResults = useRef(battleResults);
  
  // Update refs when state changes
  useEffect(() => {
    stableBattlesCompleted.current = battlesCompleted;
  }, [battlesCompleted]);
  
  useEffect(() => {
    stableBattleResults.current = battleResults;
  }, [battleResults]);

  // PERFORMANCE FIX: Memoized stable callback references
  const stableSetBattlesCompleted = useCallback((value: React.SetStateAction<number>) => {
    setBattlesCompleted(value);
  }, []);

  const stableSetBattleResults = useCallback((value: React.SetStateAction<SingleBattle[]>) => {
    setBattleResults(value);
  }, []);

  // PERFORMANCE FIX: Memoize allPokemon to prevent unnecessary re-processing
  const stableAllPokemon = useMemo(() => {
    // Ensure each Pokemon has complete type information preserved
    return allPokemon.map(pokemon => ({
      ...pokemon,
      // CRITICAL FIX: Preserve original types structure for type background colors
      types: pokemon.types || []
    }));
  }, [allPokemon.length]); // Only re-memoize when length changes, not content

  const [loadingInitiated, setLoadingInitiated] = useState(false);
  const loaderInitiatedRef = useRef(false);
  const loadingFailedRef = useRef(false);
  const retryCountRef = useRef(0);

  // Emergency reset on mount - simplified
  useEffect(() => {
    if (emergencyResetPerformed) return;
    
    const performInitialReset = () => {
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
    <div className="flex flex-col items-center w-full py-4 px-4 sm:px-6">
      <BattleContentContainer
        allPokemon={stableAllPokemon}
        initialBattleType={initialBattleType}
        initialSelectedGeneration={0}
        setBattlesCompleted={stableSetBattlesCompleted}
        setBattleResults={stableSetBattleResults}
      />
    </div>
  );
};

export default BattleMode;
