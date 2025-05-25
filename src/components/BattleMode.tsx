
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
  
  // CRITICAL FIX: Completely stable state management
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

  // CRITICAL FIX: Ultra-stable Pokemon data with complete preservation
  const stableAllPokemon = useMemo(() => {
    if (!allPokemon.length) return [];
    
    console.log('[DEBUG BattleMode] Processing Pokemon data - preserving original structure');
    
    // Log sample Pokemon types to verify data integrity
    const samplePokemon = allPokemon[0];
    if (samplePokemon) {
      console.log('[DEBUG BattleMode] Sample Pokemon types from source:', JSON.stringify(samplePokemon.types));
    }
    
    // Return the original array without any processing to preserve all data
    console.log(`[DEBUG BattleMode] Returning ${allPokemon.length} Pokemon with preserved data`);
    return allPokemon;
  }, [allPokemon]); // Depend on the actual array reference

  // CRITICAL FIX: Ultra-stable callback references
  const stableSetBattlesCompleted = useCallback((value: React.SetStateAction<number>) => {
    setBattlesCompleted(value);
  }, []); // Never changes

  const stableSetBattleResults = useCallback((value: React.SetStateAction<SingleBattle[]>) => {
    setBattleResults(value);
  }, []); // Never changes

  const [loadingInitiated, setLoadingInitiated] = useState(false);
  const loaderInitiatedRef = useRef(false);

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
    const loadPokemonOnce = async () => {
      if (!loaderInitiatedRef.current) {
        try {
          loaderInitiatedRef.current = true;
          setLoadingInitiated(true);
          await loadPokemon(0, true);
        } catch (error) {
          console.error("❌ Failed to load Pokémon:", error);
        }
      }
    };

    loadPokemonOnce();
  }, [loadPokemon]);

  // Loading state
  if (isLoading || !stableAllPokemon.length) {
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p>Loading Pokémon data...</p>
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Stable component key to prevent unmounting
  const containerKey = `battle-container-${stableAllPokemon.length}`;

  return (
    <PokemonProvider allPokemon={stableAllPokemon}>
      <div className="flex flex-col items-center w-full py-4 px-4 sm:px-6">
        <BattleContentContainer
          key={containerKey}
          allPokemon={stableAllPokemon}
          initialBattleType={initialBattleType.current}
          initialSelectedGeneration={0}
          setBattlesCompleted={stableSetBattlesCompleted}
          setBattleResults={stableSetBattleResults}
        />
      </div>
    </PokemonProvider>
  );
};

export default BattleMode;
