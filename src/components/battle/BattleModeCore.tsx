
import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import BattleModeLoader from "./BattleModeLoader";
import BattleModeProvider from "./BattleModeProvider";
import BattleModeContainer from "./BattleModeContainer";
import { RefinementQueueProvider } from "./RefinementQueueProvider";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import { useTrueSkillStore } from "@/stores/trueskillStore";

const BattleModeCore: React.FC = () => {
  console.log('[DEBUG BattleModeCore] Component rendering');
  console.log(`🔄 [REFINEMENT_PROVIDER_TOP_LEVEL] Wrapping entire BattleMode with single RefinementQueueProvider`);
  
  // CRITICAL FIX: Stable state management with TrueSkill awareness
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  const { getAllRatings } = useTrueSkillStore();

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
    
    console.log(`🔒 [POKEMON_LOADING_FIX] BattleModeCore using complete Pokemon dataset: ${allPokemon.length}`);
    return allPokemon;
  }, [allPokemon.length > 0 ? 'HAS_POKEMON' : 'NO_POKEMON']);

  // CRITICAL FIX: Ultra-stable callback references that never change
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

  // ENHANCED: Smart initialization that preserves TrueSkill consistency
  useEffect(() => {
    if (hasInitialized) return;
    
    const performSmartInitialization = () => {
      console.log(`🧹 [SMART_INIT] Performing smart initialization`);
      
      // Get current TrueSkill state
      const currentRatings = getAllRatings();
      const ratingsCount = Object.keys(currentRatings).length;
      
      console.log(`🧹 [SMART_INIT] Found ${ratingsCount} existing TrueSkill ratings`);
      
      // Only clear battle tracking data, preserve TrueSkill ratings
      const keysToRemove = [
        'pokemon-battle-recently-used',
        'pokemon-battle-last-battle',
        'pokemon-ranker-battle-history',
        'pokemon-battle-history',
        'pokemon-battle-tracking',
        'pokemon-battle-seen'
      ];
      
      // CRITICAL: Only clear battle count if no TrueSkill ratings exist
      if (ratingsCount === 0) {
        keysToRemove.push('pokemon-battle-count');
        console.log(`🧹 [SMART_INIT] No TrueSkill ratings found, clearing battle count too`);
      } else {
        console.log(`🧹 [SMART_INIT] TrueSkill ratings exist, preserving battle count`);
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Load saved battle count if TrueSkill data exists
      if (ratingsCount > 0) {
        const savedBattleCount = localStorage.getItem('pokemon-battle-count');
        if (savedBattleCount) {
          const count = parseInt(savedBattleCount, 10);
          console.log(`🧹 [SMART_INIT] Restoring battle count: ${count}`);
          setBattlesCompleted(count);
        } else {
          // Estimate battle count from TrueSkill data
          const estimatedBattles = Object.values(currentRatings).reduce((sum, rating) => sum + (rating.battleCount || 0), 0) / 2;
          console.log(`🧹 [SMART_INIT] Estimating battle count from TrueSkill: ${estimatedBattles}`);
          setBattlesCompleted(Math.floor(estimatedBattles));
        }
      }
      
      setHasInitialized(true);
      console.log('[DEBUG BattleModeCore] Smart initialization completed');
    };
    
    const timer = setTimeout(performSmartInitialization, 200);
    return () => clearTimeout(timer);
  }, [hasInitialized, getAllRatings]);

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
