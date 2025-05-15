
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleInteractions = (
  currentBattle: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  selectedPokemon: number[],
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  battleResults: any[],
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  handleTripletSelectionComplete: () => void,
  handleNavigateBack: () => void,
  battleType: BattleType
) => {
  console.log("useBattleInteractions initialized with battleType:", battleType);

  const handlePokemonSelect = (id: number) => {
    console.log(`Handling Pokemon selection (id: ${id}) in ${battleType} mode`);
    
    if (battleType === "pairs") {
      // For pairs mode, we don't update the UI state at all
      // Just save to history and immediately process
      console.log(`Selected pokemon with ID ${id} in pairs mode, processing immediately`);
      
      // Save to history
      setBattleHistory(prev => [...prev, { 
        battle: [...currentBattle], 
        selected: [id] 
      }]);
      
      // Skip updating the selection state in the UI and directly trigger completion
      // This prevents the "Selected" state from being shown momentarily
      handleTripletSelectionComplete();
      
      // Update selection state after triggering completion
      // This ensures the state is correct for the next battle
      setSelectedPokemon([id]);
    } else {
      // For triplets, toggle selection in the array
      setSelectedPokemon(prev => {
        if (prev.includes(id)) {
          return prev.filter(pokemonId => pokemonId !== id);
        } else {
          return [...prev, id];
        }
      });
    }
  };

  const handleGoBack = () => {
    handleNavigateBack();
  };

  return {
    handlePokemonSelect,
    handleGoBack
  };
};
