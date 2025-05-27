
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import BattleContentContainer from "@/components/battle/BattleContentContainer";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { SingleBattle, BattleType } from "@/hooks/battle/types";
import { PokemonProvider } from "@/contexts/PokemonContext";

const BattleMode = () => {
  console.log('[DEBUG BattleMode] Component rendering');
  
  const { allPokemon, isLoading, isBackgroundLoading, loadPokemon } = usePokemonLoader();
  
  // CRITICAL FIX: Completely stable state management
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  const [emergencyResetPerformed, setEmergencyResetPerformed] = useState(false);

  // CRITICAL FIX: Store battle type in ref to prevent re-renders and use stable initial value
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

  // CRITICAL FIX: Add detailed logging to track Pokemon loading milestones
  const stableAllPokemon = useMemo(() => {
    if (!allPokemon.length) return [];
    
    console.log(`🎯 [LOADING_MILESTONE_DEBUG] BattleMode stabilizing Pokemon data:`, {
      length: allPokemon.length,
      timestamp: new Date().toISOString(),
      isStable: true
    });
    
    // CRITICAL: Track the two milestone numbers the user mentioned
    if (allPokemon.length === 1271) {
      console.log(`🚨 [LOADING_MILESTONE_DEBUG] HIT 1271 MILESTONE - This might trigger refresh!`);
    }
    if (allPokemon.length === 1025) {
      console.log(`🚨 [LOADING_MILESTONE_DEBUG] HIT 1025 MILESTONE - This might trigger refresh!`);
    }
    
    // CRITICAL: Log sample Pokemon to verify types in source data BEFORE any processing
    const samplePokemon = allPokemon.find(p => p.id === 60) || allPokemon[0]; // Poliwag
    if (samplePokemon) {
      console.log('[CRITICAL DEBUG] BattleMode source Pokemon sample (BEFORE processing):', JSON.stringify({
        id: samplePokemon.id,
        name: samplePokemon.name,
        types: samplePokemon.types,
        typesIsArray: Array.isArray(samplePokemon.types),
        typesLength: samplePokemon.types?.length || 0,
        firstType: samplePokemon.types?.[0],
        rawTypesStructure: samplePokemon.types,
        fullSample: {
          id: samplePokemon.id,
          name: samplePokemon.name,
          types: samplePokemon.types
        }
      }));
      
      // CRITICAL: If types are missing at the source, this is the root problem
      if (!samplePokemon.types || samplePokemon.types.length === 0) {
        console.error('[CRITICAL ERROR] BattleMode received Pokemon data without types! Source data issue detected.');
        console.error('[CRITICAL ERROR] Sample Pokemon object:', JSON.stringify(samplePokemon));
      }
    }
    
    // Return the EXACT original allPokemon array - no modifications whatsoever
    console.log('[CRITICAL DEBUG] BattleMode returning unmodified allPokemon array');
    return allPokemon;
  }, [allPokemon]);

  // CRITICAL FIX: Ultra-stable callback references that never change
  const stableSetBattlesCompleted = useCallback((value: React.SetStateAction<number>) => {
    setBattlesCompleted(value);
  }, []);

  const stableSetBattleResults = useCallback((value: React.SetStateAction<SingleBattle[]>) => {
    setBattleResults(value);
  }, []);

  const [loadingInitiated, setLoadingInitiated] = useState(false);
  const loaderInitiatedRef = useRef(false);

  // Emergency reset on mount - simplified
  useEffect(() => {
    if (emergencyResetPerformed) return;
    
    const performInitialReset = () => {
      console.log(`🧹 [LOADING_MILESTONE_DEBUG] Performing initial reset`);
      
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
  
  // Simplified Pokemon loading with detailed milestone tracking
  useEffect(() => {
    const loadPokemonOnce = async () => {
      if (!loaderInitiatedRef.current) {
        try {
          console.log(`🎯 [LOADING_MILESTONE_DEBUG] BattleMode initiating Pokemon load`);
          loaderInitiatedRef.current = true;
          setLoadingInitiated(true);
          await loadPokemon(0, true);
          console.log(`🎯 [LOADING_MILESTONE_DEBUG] BattleMode Pokemon load completed`);
        } catch (error) {
          console.error("❌ Failed to load Pokémon:", error);
        }
      }
    };

    loadPokemonOnce();
  }, [loadPokemon]);

  // Loading state
  if (isLoading || !stableAllPokemon.length) {
    console.log(`🎯 [LOADING_MILESTONE_DEBUG] BattleMode showing loading state - isLoading: ${isLoading}, Pokemon count: ${stableAllPokemon.length}`);
    
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p>Loading initial Pokémon for battles...</p>
          {isBackgroundLoading && (
            <p className="text-sm text-gray-600 mt-2">
              Loading more Pokémon in the background...
            </p>
          )}
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Static component key to prevent unmounting - use data length only
  const containerKey = `battle-container-${stableAllPokemon.length}`;
  
  console.log(`🎯 [LOADING_MILESTONE_DEBUG] BattleMode rendering with containerKey: ${containerKey}, Pokemon count: ${stableAllPokemon.length}`);

  return (
    <PokemonProvider allPokemon={stableAllPokemon}>
      <div className="flex flex-col items-center w-full py-4 px-4 sm:px-6">
        {isBackgroundLoading && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              🔄 Loading more Pokémon in the background... ({stableAllPokemon.length} loaded so far)
            </p>
          </div>
        )}
        <BattleContentContainer
          key={containerKey}
          allPokemon={stableAllPokemon}
          initialBattleType={initialBattleType}
          initialSelectedGeneration={0}
          setBattlesCompleted={stableSetBattlesCompleted}
          setBattleResults={stableSetBattleResults}
        />
      </div>
    </PokemonProvider>
  );
};

export default BattleMode;
