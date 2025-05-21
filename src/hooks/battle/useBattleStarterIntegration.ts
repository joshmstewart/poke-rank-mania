
import { useMemo, useCallback, useEffect, useRef } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { createBattleStarter } from "./createBattleStarter";

export const useBattleStarterIntegration = (
  allPokemon: Pokemon[],
  currentRankings: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  // Add ref to track if we've verified suggestions
  const verifiedSuggestionsRef = useRef(false);

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

  // Effect to verify suggestions in currentRankings 
  useEffect(() => {
    if (!verifiedSuggestionsRef.current && currentRankings && currentRankings.length > 0) {
      verifiedSuggestionsRef.current = true;
      
      // Count and log suggestions
      const suggestedCount = currentRankings.filter(p => 
        (p as RankedPokemon).suggestedAdjustment).length;
      
      const unusedCount = currentRankings.filter(p => 
        (p as RankedPokemon).suggestedAdjustment && 
        !(p as RankedPokemon).suggestedAdjustment?.used).length;
      
      console.log(`🔍 VERIFY: currentRankings has ${suggestedCount} Pokemon with suggestions (${unusedCount} unused)`);
      
      if (unusedCount > 0) {
        // Log the first few suggestions for verification
        const withSuggestions = currentRankings.filter(p => 
          (p as RankedPokemon).suggestedAdjustment && 
          !(p as RankedPokemon).suggestedAdjustment?.used
        ).slice(0, 3);
        
        withSuggestions.forEach(p => {
          const rp = p as RankedPokemon;
          console.log(`  - ${p.name}: ${rp.suggestedAdjustment?.direction} x${rp.suggestedAdjustment?.strength}`);
        });
      }
    }
  }, [currentRankings]);

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
  const startNewBattle = useCallback((battleType: BattleType): Pokemon[] => {
    console.log("startNewBattle with type:", battleType);
    
    if (!allPokemon || allPokemon.length < 2) {
      console.warn("Not enough Pokémon for a battle.");
      return [];
    }

    // Update localStorage with battle type
    localStorage.setItem('pokemon-ranker-battle-type', battleType);

    try {
      // Start a new battle using our battle starter
      if (battleStarter) {
        console.log("Using battleStarter to start new battle with", battleType);
        const battlePokemon = battleStarter.startNewBattle(battleType);
        
        // Reset selected Pokemon
        setSelectedPokemon([]);
        
        return battlePokemon;
      } else {
        console.error("Battle starter not initialized");
        // Initialize with random pokemon as fallback
        if (allPokemon && allPokemon.length >= 2) {
          const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
          const selectedForBattle = shuffled.slice(0, battleType === "pairs" ? 2 : 3);
          console.log("Fallback battle started with pokemon:", selectedForBattle.map(p => p.name));
          setCurrentBattle(selectedForBattle);
          setSelectedPokemon([]);
          return selectedForBattle;
        }
        return [];
      }
    } catch (error) {
      console.error("Error starting new battle:", error);
      // Even if there's an error, try to set up a basic battle
      try {
        const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
        const battleSize = battleType === "triplets" ? 3 : 2;
        if (shuffled.length >= battleSize) {
          const selectedForBattle = shuffled.slice(0, battleSize);
          setCurrentBattle(selectedForBattle);
          setSelectedPokemon([]);
          console.log("Emergency battle recovery with:", selectedForBattle.map(p => p.name));
          return selectedForBattle;
        }
      } catch (fallbackError) {
        console.error("Even fallback battle setup failed:", fallbackError);
      }
      return [];
    }
  }, [battleStarter, setCurrentBattle, allPokemon, setSelectedPokemon]);

  return {
    battleStarter,
    startNewBattle
  };
};
