
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
      
      if (!pokemon || pokemon.length === 0) {
        console.error("Failed to load Pokemon - API returned empty array");
        toast({
          title: "Error",
          description: "No Pokémon data could be loaded. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
        return [];
      }
      
      console.log(`Successfully loaded ${pokemon.length} Pokemon for generation ${genId}`);
      
      // ALWAYS update allPokemon state first
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
      
      // Wait for states to update before starting a new battle
     setTimeout(() => {
  // Start the first battle or continue from previous battle
  if (Array.isArray(pokemon) && pokemon.length > 0 && typeof pokemon[0] === "object" && "id" in pokemon[0]) {
    console.log("✅ Starting initial battle with", pokemon.length, "Pokémon");
    try {
      startNewBattle(pokemon, battleType);
    } catch (e) {
      console.error("Error starting initial battle:", e);
      toast({
        title: "Error",
        description: "Could not start battle. Please try refreshing the page.",
        variant: "destructive"
      });
    }
  } else {
    console.error("❌ Invalid Pokémon data:", pokemon);
    toast({
      title: "Error",
      description: "Invalid Pokémon data received. Please refresh or try again.",
      variant: "destructive"
    });
  }

  setIsLoading(false);
}, 100);

      
      return pokemon;
    } catch (error) {
      console.error('Error loading Pokémon:', error);
      toast({
        title: "Error",
        description: "Failed to load Pokémon. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
      return [];
    }
  };

  return {
    isLoading,
    setIsLoading,
    loadPokemon
  };
};
