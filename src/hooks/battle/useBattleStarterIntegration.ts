
import { useMemo, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { createBattleStarter } from "./createBattleStarter";

export const useBattleStarterIntegration = (
  allPokemon: Pokemon[],
  currentRankings: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  // Create the battle starter function without hooks
  const battleStarter = useMemo(() => {
    if (!allPokemon || allPokemon.length === 0) {
      return null;
    }
    
    // Create a functions-only battle starter
    return createBattleStarter(
      allPokemon,
      allPokemon,
      currentRankings,
      setCurrentBattle
    );
  }, [allPokemon, currentRankings, setCurrentBattle]);

  // Start a new battle
  const startNewBattle = useCallback((pokemonList: Pokemon[], battleType: BattleType) => {
    console.log("startNewBattle with", pokemonList?.length, battleType);
    
    if (!pokemonList || pokemonList.length < 2) {
      console.warn("Not enough Pokémon for a battle.");
      return;
    }

    // Update localStorage with battle type
    localStorage.setItem('pokemon-ranker-battle-type', battleType);

    try {
      // Start a new battle using our battle starter
      if (battleStarter) {
        const newBattlePokemon = battleStarter.startNewBattle(battleType);
        
        if (newBattlePokemon && newBattlePokemon.length > 0) {
          // Reset selected Pokemon and set the new battle
          setSelectedPokemon([]);
          setCurrentBattle(newBattlePokemon);
          console.log("New battle started with:", newBattlePokemon.map(p => p.name).join(", "));
        } else {
          console.error("Failed to create new battle - no Pokémon returned");
        }
      } else {
        console.error("Battle starter not initialized");
        // Initialize with random pokemon as fallback
        if (pokemonList && pokemonList.length >= 2) {
          const shuffled = [...pokemonList].sort(() => Math.random() - 0.5);
          const selectedForBattle = shuffled.slice(0, battleType === "pairs" ? 2 : 3);
          setCurrentBattle(selectedForBattle);
          console.log("Fallback battle started with:", selectedForBattle.map(p => p.name).join(", "));
        }
      }
    } catch (error) {
      console.error("Error starting new battle:", error);
    }
  }, [battleStarter, setCurrentBattle, setSelectedPokemon]);

  return {
    battleStarter,
    startNewBattle
  };
};
