
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

  // Track if we're currently processing a selection to prevent duplicate processing
  let isProcessingSelection = false;

  const handlePokemonSelect = (id: number) => {
    console.log(`Handling Pokemon selection (id: ${id}) in ${battleType} mode`);
    
    // Prevent duplicate processing
    if (isProcessingSelection) {
      console.log("Already processing a selection, ignoring this click");
      return;
    }

    if (battleType === "pairs") {
      // For pairs mode - immediate selection and directly process completion
      console.log("Pairs mode: Setting selection and triggering completion");
      
      // Lock to prevent duplicate processing
      isProcessingSelection = true;
      
      // Set the selection immediately
      setSelectedPokemon([id]);
      
      // Add to history
      setBattleHistory(prev => [...prev, { 
        battle: [...currentBattle], 
        selected: [id] 
      }]);
      
      // Important: Call the completion handler synchronously
      handleTripletSelectionComplete();

      // Reset processing lock after a short delay
      setTimeout(() => {
        isProcessingSelection = false;
      }, 500);
    } else {
      // For triplets mode - toggle selection
      setSelectedPokemon(prev => {
        const newSelection = prev.includes(id)
          ? prev.filter(pokemonId => pokemonId !== id)
          : [...prev, id];
        return newSelection;
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
