
import { useState } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

export const usePokemonLoader = (
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setBattleHistory: React.Dispatch<React.SetStateAction<any[]>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  startNewBattle: (pokemonList: Pokemon[]) => void
) => {
  const [isLoading, setIsLoading] = useState(true);

  const loadPokemon = async (genId = 0, fullRankingMode = false, preserveState = false) => {
    setIsLoading(true);
    try {
      // Use fetchAllPokemon instead of trying to hit a non-existent API endpoint
      const pokemon = await fetchAllPokemon(genId, fullRankingMode);
      
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
      
      return pokemon;
    } catch (error) {
      console.error('Error loading Pokémon:', error);
      toast({
        title: "Error",
        description: "Failed to load Pokémon. Please try again.",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    setIsLoading,
    loadPokemon
  };
};
