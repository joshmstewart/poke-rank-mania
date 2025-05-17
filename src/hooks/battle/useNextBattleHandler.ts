
import { useCallback, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { toast } from "@/hooks/use-toast";

/**
 * Hook to handle the setup of the next battle
 */
export const useNextBattleHandler = (
  allPokemon: Pokemon[],
  startNewBattle: (battleType: BattleType) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  // Add a ref to prevent concurrent setup attempts
  const isSettingUpRef = useRef(false);
  
  // Set up the next battle
  const setupNextBattle = useCallback((battleType: BattleType) => {
    // Prevent concurrent setup attempts
    if (isSettingUpRef.current) {
      console.log("useNextBattleHandler: Already setting up a battle, skipping");
      return false;
    }
    
    isSettingUpRef.current = true;
    console.log("useNextBattleHandler: Setting up next battle with type:", battleType);
    
    // Clear selections first
    setSelectedPokemon([]);
    
    // Validate pokemon data
    if (!allPokemon || allPokemon.length < 2) {
      toast({
        title: "Error",
        description: "Not enough Pokémon available for battle",
        variant: "destructive"
      });
      isSettingUpRef.current = false;
      return false;
    }
    
    try {
      // Start a new battle immediately
      console.log("useNextBattleHandler: Starting new battle");
      startNewBattle(battleType);
      
      // Reset flag after successful battle start
      setTimeout(() => {
        isSettingUpRef.current = false;
      }, 100);
      
      return true;
    } catch (error) {
      console.error("useNextBattleHandler: Error starting new battle:", error);
      isSettingUpRef.current = false;
      return false;
    }
  }, [allPokemon, startNewBattle, setSelectedPokemon]);

  return { setupNextBattle };
};
