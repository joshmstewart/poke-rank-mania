
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
      // For pairs mode, immediately select the Pokémon and process the battle
      
      // First, update the selections state
      setSelectedPokemon([id]);
      
      // Then update history
      setBattleHistory(prev => [...prev, { 
        battle: [...currentBattle], 
        selected: [id] 
      }]);
      
      // Directly call the triplet selection complete handler
      // without setTimeout to ensure synchronous execution
      handleTripletSelectionComplete();
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
