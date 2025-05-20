
import { useState, useCallback } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { BattleType } from "./types";

export const usePokemonLoader = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [battleType, setBattleType] = useState<BattleType>("pairs");
  const [loadAttempted, setLoadAttempted] = useState(false);

  const startNewBattle = useCallback((pokemonList: Pokemon[], type: BattleType = battleType): Pokemon[] => {
    if (pokemonList.length < 2) {
      toast({
        title: "Not enough Pokémon",
        description: "Need at least 2 Pokémon for a battle.",
        variant: "destructive"
      });
      return [];
    }
    
    setBattleType(type);
    
    const shuffled = [...pokemonList].sort(() => Math.random() - 0.5);
    const battleSize = type === "triplets" ? 3 : 2;
    return shuffled.slice(0, battleSize);
  }, [battleType]);

  const loadPokemon = useCallback(async (genId = 0, fullRankingMode = false, preserveState = false) => {
    // Prevent multiple loading attempts
    if (isLoading && loadAttempted) {
      console.log("Already loading Pokemon, skipping redundant call");
      return allPokemon;
    }

    setIsLoading(true);
    setLoadAttempted(true);
    
    try {
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
      setAllPokemon(pokemon);
      
      setIsLoading(false);
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
  }, [isLoading, allPokemon, loadAttempted]);

  return {
    isLoading,
    setIsLoading,
    allPokemon,
    loadPokemon,
    startNewBattle,
    battleType
  };
};
