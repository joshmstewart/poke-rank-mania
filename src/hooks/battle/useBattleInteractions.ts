
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
      // For pairs mode, we need to ensure the selection is passed correctly
      
      // Set the selection first so it's available for processing
      setSelectedPokemon([id]);
      
      // Update history with the selection
      setBattleHistory(prev => [...prev, { 
        battle: [...currentBattle], 
        selected: [id] 
      }]);
      
      // Add a small delay to ensure state updates before processing
      setTimeout(() => {
        handleTripletSelectionComplete();
      }, 10);
    } else {
      // For triplets/trios, toggle selection in the array
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
