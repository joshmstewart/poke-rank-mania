
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleSelectionManager = (
  processBattleResult: (selectedPokemonIds: number[], currentBattlePokemon: Pokemon[], battleType: BattleType) => void,
  battleType: BattleType,
  selectedPokemon: number[],
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  currentBattle: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  generateRankings: any
) => {
  const handlePokemonSelect = useCallback((pokemonId: number) => {
    if (!currentBattle || currentBattle.length === 0) return;
    
    setSelectedPokemon(prev => {
      const newSelected = [...prev, pokemonId];
      
      // For pairs mode, select immediately
      if (battleType === "pairs") {
        const currentBattleCopy = [...currentBattle];
        // Save to history before processing
        setBattleHistory(prevHistory => [...prevHistory, { 
          battle: currentBattleCopy, 
          selected: newSelected 
        }]);
        
        processBattleResult(newSelected, currentBattle, battleType);
      }
      
      return newSelected;
    });
  }, [
    currentBattle,
    battleType,
    setBattleHistory,
    processBattleResult,
    setSelectedPokemon
  ]);

  const handleTripletSelectionComplete = useCallback(() => {
    if (selectedPokemon.length === 0 || !currentBattle || currentBattle.length === 0) return;
    
    // Save current battle to history
    const currentBattleCopy = [...currentBattle];
    setBattleHistory(prev => [...prev, { 
      battle: currentBattleCopy, 
      selected: selectedPokemon 
    }]);
    
    processBattleResult(selectedPokemon, currentBattle, battleType);
    setSelectedPokemon([]);
  }, [
    selectedPokemon,
    currentBattle,
    battleType,
    setBattleHistory,
    processBattleResult,
    setSelectedPokemon
  ]);

  const goBack = useCallback(() => {
    if (battleHistory.length === 0) return;
    
    const newHistory = [...battleHistory];
    const lastBattle = newHistory.pop();
    setBattleHistory(newHistory);
    
    if (lastBattle) {
      setCurrentBattle(lastBattle.battle);
      setSelectedPokemon([]);
    }
    
    setBattlesCompleted(prev => Math.max(0, prev - 1));
  }, [
    battleHistory,
    setBattleHistory,
    setCurrentBattle,
    setSelectedPokemon,
    setBattlesCompleted
  ]);

  const handleSelection = useCallback((selectedPokemonIds: number[]) => {
    console.log("⚫ useBattleSelectionManager: Pokémon selected, incrementing battle");
    processBattleResult(selectedPokemonIds, currentBattle, battleType);
  }, [processBattleResult, currentBattle, battleType]);

  return { 
    handleSelection,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    goBack
  };
};
