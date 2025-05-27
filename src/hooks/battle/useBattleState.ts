
import { useState, useCallback, useRef, useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleState = (
  stableInitialBattleType: BattleType,
  stableInitialGeneration: number
) => {
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [battleResults, setBattleResults] = useState<any[]>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState(stableInitialGeneration);
  
  const initialBattleTypeStored = localStorage.getItem('pokemon-ranker-battle-type') as BattleType || stableInitialBattleType;
  const [battleType, setBattleType] = useState<BattleType>(initialBattleTypeStored);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const stableSetCurrentBattle = useCallback((battle: Pokemon[]) => {
    console.log(`🔄 [FLASH_FIX] stableSetCurrentBattle called with ${battle.length} Pokemon`);
    setCurrentBattle(battle);
    if (battle.length > 0) {
      setIsTransitioning(false);
    }
  }, []);
  
  const stableSetSelectedPokemon = useCallback((pokemon: number[]) => {
    setSelectedPokemon(pokemon);
  }, []);

  return {
    currentBattle,
    setCurrentBattle,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    battleHistory,
    setBattleHistory,
    selectedGeneration,
    setSelectedGeneration,
    battleType,
    setBattleType,
    selectedPokemon,
    setSelectedPokemon,
    isTransitioning,
    setIsTransitioning,
    stableSetCurrentBattle,
    stableSetSelectedPokemon
  };
};
