
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { toast } from "@/hooks/use-toast";

/**
 * Hook to handle the setup of the next battle
 */
export const useNextBattleHandler = (
  allPokemon: Pokemon[],
  startNewBattle: (pokemon: Pokemon[], battleType: BattleType) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  // Set up the next battle
  const setupNextBattle = useCallback((battleType: BattleType) => {
    // Clear selections
    setSelectedPokemon([]);
    
    // Validate pokemon data
    if (!allPokemon || allPokemon.length < 2) {
      toast({
        title: "Error",
        description: "Not enough Pokémon available for battle",
        variant: "destructive"
      });
      return false;
    }
    
    // Start a new battle
    console.log("useNextBattleHandler: Starting new battle with", allPokemon.length, "Pokémon");
    startNewBattle(allPokemon, battleType);
    return true;
  }, [allPokemon, startNewBattle, setSelectedPokemon]);

  return { setupNextBattle };
};
