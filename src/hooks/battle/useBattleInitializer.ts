
import { useState } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";

export const useBattleInitializer = (
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setBattleHistory: React.Dispatch<React.SetStateAction<any[]>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);

  const loadPokemon = async (genId = 0, fullRankingMode = false, preserveState = false) => {
    setIsLoading(true);
    const pokemon = await fetchAllPokemon(genId, fullRankingMode);
    setAllPokemon(pokemon);
    
    if (!preserveState) {
      // Reset battle state if not preserving state
      setBattleResults([]);
      setBattlesCompleted(0);
      setRankingGenerated(false);
      setSelectedPokemon([]);
      setBattleHistory([]);
      setShowingMilestone(false);
      setCompletionPercentage(0);
    }
    
    // Start the first battle or continue from previous battle
    if (pokemon.length > 0) {
      startNewBattle(pokemon);
    }
    
    setIsLoading(false);
    return pokemon;
  };

  const startNewBattle = (pokemonList: Pokemon[]) => {
    if (pokemonList.length < 2) {
      // Not enough Pokémon for a battle
      return;
    }
    
    // Shuffle the list to get random Pokémon
    const shuffled = [...pokemonList].sort(() => Math.random() - 0.5);
    
    // Get the first 2 or 3 Pokémon based on battle type
    const battleSize = 2; // default to pairs, will be updated when battle type is known
    setCurrentBattle(shuffled.slice(0, battleSize));
    setSelectedPokemon([]);
  };

  return {
    isLoading,
    setIsLoading,
    allPokemon,
    setAllPokemon,
    currentBattle,
    setCurrentBattle,
    loadPokemon,
    startNewBattle
  };
};
