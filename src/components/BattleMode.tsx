
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

  // CRITICAL FIX: Use stable Pokemon reference that NEVER changes once loaded
  const stablePokemon = useMemo(() => {
    if (!allPokemon || allPokemon.length === 0) {
      return [];
    }
    
    console.log(`🔒 [POKEMON_LOADING_FIX] BattleMode using complete Pokemon dataset: ${allPokemon.length}`);
    return allPokemon;
  }, [allPokemon.length > 0 ? 'HAS_POKEMON' : 'NO_POKEMON']); // CRITICAL: Only change when we go from no Pokemon to having Pokemon

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
      console.log(`🧹 [REFRESH_FIX] Performing initial reset`);
      
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
  
  // CRITICAL FIX: Pokemon loading ONLY happens once
  useEffect(() => {
    const loadPokemonOnce = async () => {
      if (!loaderInitiatedRef.current) {
        try {
          console.log(`🔒 [POKEMON_LOADING_FIX] BattleMode initiating ONE-TIME complete Pokemon load`);
          loaderInitiatedRef.current = true;
          setLoadingInitiated(true);
          await loadPokemon(0, true);
          console.log(`🔒 [POKEMON_LOADING_FIX] BattleMode complete Pokemon load finished - WILL NOT RELOAD AGAIN`);
        } catch (error) {
          console.error("❌ Failed to load Pokémon:", error);
        }
      }
    };

    loadPokemonOnce();
  }, []); // CRITICAL FIX: Empty dependency array - only load once ever

  // Loading state
  if (isLoading || !stablePokemon.length) {
    console.log(`🔒 [POKEMON_LOADING_FIX] BattleMode showing loading state - isLoading: ${isLoading}, Pokemon count: ${stablePokemon.length}`);
    
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p>Loading complete Pokémon dataset for battles...</p>
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Static component key that NEVER changes once Pokemon are loaded
  const containerKey = `battle-container-stable`;
  
  console.log(`🔒 [POKEMON_LOADING_FIX] BattleMode rendering with STABLE containerKey: ${containerKey}, Pokemon count: ${stablePokemon.length}`);

  return (
    <PokemonProvider allPokemon={stablePokemon}>
      <div className="flex flex-col items-center w-full py-4 px-4 sm:px-6">
        <BattleContentContainer
          key={containerKey}
          allPokemon={stablePokemon}
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
