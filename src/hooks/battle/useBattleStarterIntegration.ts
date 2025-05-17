
import { useMemo, useCallback, useEffect } from "react";
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

  // Add event listener for custom set-current-battle event
  useEffect(() => {
    const handleSetCurrentBattle = (event: any) => {
      if (event.detail && event.detail.pokemon) {
        setCurrentBattle(event.detail.pokemon);
      }
    };

    // Add event listener for the custom event
    document.addEventListener('set-current-battle', handleSetCurrentBattle);

    // Clean up
    return () => {
      document.removeEventListener('set-current-battle', handleSetCurrentBattle);
    };
  }, [setCurrentBattle]);

  // Start a new battle
  const startNewBattle = useCallback((battleType: BattleType) => {
    console.log("startNewBattle with type:", battleType);
    
    if (!allPokemon || allPokemon.length < 2) {
      console.warn("Not enough Pokémon for a battle.");
      return;
    }

    // Update localStorage with battle type
    localStorage.setItem('pokemon-ranker-battle-type', battleType);

    try {
      // Start a new battle using our battle starter
      if (battleStarter) {
        console.log("Using battleStarter to start new battle with", battleType);
        battleStarter.startNewBattle(battleType);
        
        // Reset selected Pokemon
        setSelectedPokemon([]);
      } else {
        console.error("Battle starter not initialized");
        // Initialize with random pokemon as fallback
        if (allPokemon && allPokemon.length >= 2) {
          const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
          const selectedForBattle = shuffled.slice(0, battleType === "pairs" ? 2 : 3);
          console.log("Fallback battle started with pokemon:", selectedForBattle.map(p => p.name));
          setCurrentBattle(selectedForBattle);
        }
      }
    } catch (error) {
      console.error("Error starting new battle:", error);
    }
  }, [battleStarter, setCurrentBattle, allPokemon, setSelectedPokemon]);

  return {
    battleStarter,
    startNewBattle
  };
};
