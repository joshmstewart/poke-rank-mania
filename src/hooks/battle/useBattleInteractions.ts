
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
  goBack: () => void,
  battleType: BattleType
) => {
  const handlePokemonSelect = (id: number) => {
    if (battleType === "triplets") {
      // For triplets, manage selection state, but don't complete the battle
      const newSelected = selectedPokemon.includes(id)
        ? selectedPokemon.filter(pokemonId => pokemonId !== id)
        : [...selectedPokemon, id];
      setSelectedPokemon(newSelected);
    } else {
      // For pairs, immediately handle the selection as a completed battle
      // First save to battle history
      setBattleHistory([...battleHistory, { 
        battle: [...currentBattle], 
        selected: [id] 
      }]);
      
      // Then simulate a triplet completion with just one selected ID
      handleTripletSelectionComplete();
    }
  };

  const handleGoBack = () => {
    goBack();
  };

  return {
    handlePokemonSelect,
    handleGoBack
  };
};
