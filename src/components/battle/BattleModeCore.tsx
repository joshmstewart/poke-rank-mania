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

  // SIMPLIFIED: Only restore battle count from localStorage, no smart preservation
  useEffect(() => {
    if (hasInitialized) return;
    
    const performSimpleInitialization = () => {
      console.log(`🧹 [SIMPLE_INIT] Performing simple initialization`);
      
      // Only restore battle count if it exists in localStorage
      const savedBattleCount = localStorage.getItem('pokemon-battle-count');
      if (savedBattleCount) {
        const count = parseInt(savedBattleCount, 10);
        if (!isNaN(count) && count > 0) {
          console.log(`🧹 [SIMPLE_INIT] Restoring battle count: ${count}`);
          setBattlesCompleted(count);
        }
      }
      
      setHasInitialized(true);
      console.log('[DEBUG BattleModeCore] Simple initialization completed');
    };
    
    const timer = setTimeout(performSimpleInitialization, 200);
    return () => clearTimeout(timer);
  }, [hasInitialized]);

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
