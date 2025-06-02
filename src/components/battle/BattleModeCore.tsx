
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
  
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  const { getAllRatings, isHydrated, waitForHydration } = useTrueSkillStore();

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

  // CLOUD-FIRST: Initialize battle count from TrueSkill cloud data
  useEffect(() => {
    if (hasInitialized) return;
    
    const performCloudInitialization = async () => {
      console.log(`🌥️ [CLOUD_BATTLE_INIT] Performing cloud-first initialization`);
      
      if (!isHydrated) {
        console.log(`🌥️ [CLOUD_BATTLE_INIT] Waiting for TrueSkill hydration...`);
        await waitForHydration();
      }
      
      // Get battle count from TrueSkill cloud data
      const ratings = getAllRatings();
      const totalBattles = Object.values(ratings).reduce((sum, rating) => {
        return sum + (rating.battleCount || 0);
      }, 0);
      
      console.log(`🌥️ [CLOUD_BATTLE_INIT] Setting battle count from cloud: ${totalBattles}`);
      setBattlesCompleted(totalBattles);
      
      setHasInitialized(true);
      console.log('[DEBUG BattleModeCore] Cloud initialization completed');
    };
    
    performCloudInitialization();
  }, [hasInitialized, isHydrated, getAllRatings, waitForHydration]);

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
