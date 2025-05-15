
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
    // Clear selections first
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
    
    // Start a new battle - ensure this isn't blocked by any state updates
    console.log("useNextBattleHandler: Starting new battle with", allPokemon.length, "Pokémon");
    
    // Use a small timeout to ensure state updates have completed
    setTimeout(() => {
      startNewBattle(allPokemon, battleType);
    }, 100);
    
    return true;
  }, [allPokemon, startNewBattle, setSelectedPokemon]);

  return { setupNextBattle };
};
