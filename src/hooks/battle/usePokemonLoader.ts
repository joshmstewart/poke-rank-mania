
import { useState } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { BattleType } from "./types";

export const usePokemonLoader = ({
  setAllPokemon,
  setRankingGenerated,
  setBattleResults,
  setBattlesCompleted,
  setBattleHistory,
  setShowingMilestone,
  setCompletionPercentage,
  setSelectedPokemon,
  startNewBattle,
  battleType
}: {
  setAllPokemon: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setBattleHistory: React.Dispatch<React.SetStateAction<any[]>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  startNewBattle: (pokemonList: Pokemon[], battleType: BattleType) => void,
  battleType: BattleType
}) => {

  const [isLoading, setIsLoading] = useState(true);

  const loadPokemon = async (genId = 0, fullRankingMode = false, preserveState = false) => {
    setIsLoading(true);
    try {
      // Use fetchAllPokemon instead of trying to hit a non-existent API endpoint
      const pokemon = await fetchAllPokemon(genId, fullRankingMode);
      
      // FIXED: Always update allPokemon state
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
        console.log("Starting initial battle with", pokemon.length, "Pokémon");
        startNewBattle(pokemon, battleType);
      } else {
        console.error("No Pokémon loaded");
        toast({
          title: "Error",
          description: "No Pokémon loaded. Please try again.",
          variant: "destructive"
        });
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
