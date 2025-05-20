import { useCallback, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { toast } from "@/hooks/use-toast";

export const useNextBattleHandler = (
  allPokemon: Pokemon[],
  startNewBattle: (battleType: BattleType, excludePokemon?: Pokemon[]) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  const isSettingUpRef = useRef(false);

  const setupNextBattle = useCallback((battleType: BattleType, excludePokemon?: Pokemon[]) => {
    if (isSettingUpRef.current) return;

    isSettingUpRef.current = true;
    setSelectedPokemon([]);

    if (!allPokemon || allPokemon.length < 2) {
      toast({
        title: "Error",
        description: "Not enough Pokémon available for battle.",
        variant: "destructive"
      });
      isSettingUpRef.current = false;
      return;
    }

    try {
      startNewBattle(battleType, excludePokemon);
    } catch (error) {
      console.error("Error starting new battle:", error);
    } finally {
      isSettingUpRef.current = false;
    }
  }, [allPokemon, startNewBattle, setSelectedPokemon]);

  return { setupNextBattle };
};
