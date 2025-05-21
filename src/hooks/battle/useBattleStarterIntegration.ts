
import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { createBattleStarter } from "./createBattleStarter";
import { useBattleEmergencyReset } from "./useBattleEmergencyReset";
import { toast } from "@/hooks/use-toast";

export const useBattleStarterIntegration = (
  allPokemon: Pokemon[],
  currentRankings: RankedPokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  const battleStarter = useMemo(() => {
    if (!allPokemon || allPokemon.length === 0) return null;

    const pokemonWithSuggestions = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
    
    console.log(`🎯 Found ${pokemonWithSuggestions.length} Pokemon with pending suggestions`);
    
    // Enhanced battle starter with suggestion prioritization
    return createBattleStarter(
      allPokemon,
      allPokemon,
      currentRankings,
      setCurrentBattle,
      pokemonWithSuggestions
    );
  }, [allPokemon, currentRankings, setCurrentBattle]);

  const { performEmergencyReset } = useBattleEmergencyReset(
    [] as Pokemon[],
    setCurrentBattle,
    allPokemon
  );

  return {
    battleStarter,
    startNewBattle: battleStarter?.startNewBattle || (() => [])
  };
};
