
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
  
  // Use a simple state to prevent multiple rapid clicks
  let processingClick = false;

  const handlePokemonSelect = (id: number) => {
    // If already processing a click, ignore this one
    if (processingClick) return;
    
    // Set processing flag to prevent multiple clicks
    processingClick = true;
    
    console.log(`Handling Pokemon selection (id: ${id}) in ${battleType} mode`);
    
    if (battleType === "pairs") {
      // For pairs mode:
      
      // 1. Set the selection immediately
      setSelectedPokemon([id]);
      
      // 2. Update history
      setBattleHistory(prev => [...prev, { 
        battle: [...currentBattle], 
        selected: [id] 
      }]);
      
      // 3. Immediately trigger the triplet selection handler
      handleTripletSelectionComplete();
      
      // Clear the processing flag after a short delay
      setTimeout(() => {
        processingClick = false;
      }, 300);
    } else {
      // For triplets/trios, toggle selection in the array
      setSelectedPokemon(prev => {
        const newSelection = prev.includes(id)
          ? prev.filter(pokemonId => pokemonId !== id)
          : [...prev, id];
          
        // Clear the processing flag
        setTimeout(() => {
          processingClick = false;
        }, 100);
        
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
