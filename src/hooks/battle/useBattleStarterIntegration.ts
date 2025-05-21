
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
  
  // Add tracking for recently used Pokémon to avoid repetition
  const recentlyUsedPokemonRef = useRef<Set<number>>(new Set());
  
  // Add tracking specifically for last battle to absolutely prevent immediate repeats
  const lastBattlePokemonRef = useRef<Set<number>>(new Set());
  
  // Add counter to track battle attempts
  const battleAttemptsRef = useRef(0);

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

  // Helper function to shuffle array
  const shuffleArray = useCallback(<T>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }, []);

  // Start a new battle
  const startNewBattle = useCallback((battleType: BattleType): Pokemon[] => {
    battleAttemptsRef.current += 1;
    console.log(`⚔️ startNewBattle attempt #${battleAttemptsRef.current} with type: ${battleType}`);
    
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
        
        // CRITICAL FIX: Check if we got the same Pokémon again and log a warning
        const sameAsPreviousBattle = battlePokemon.every(p => lastBattlePokemonRef.current.has(p.id));
        if (sameAsPreviousBattle) {
          console.error("⚠️⚠️⚠️ WARNING: Generated the same battle as previous! This should not happen!");
        }
        
        // Clear last battle and add new ones
        lastBattlePokemonRef.current.clear();
        
        // Track these Pokémon as recently used and last battle
        battlePokemon.forEach(p => {
          recentlyUsedPokemonRef.current.add(p.id);
          lastBattlePokemonRef.current.add(p.id);
          // Cap the set size
          if (recentlyUsedPokemonRef.current.size > Math.min(20, allPokemon.length / 3)) {
            const oldestId = Array.from(recentlyUsedPokemonRef.current)[0];
            recentlyUsedPokemonRef.current.delete(oldestId);
          }
        });
        
        console.log(`🔄 Updated recently used Pokémon tracking (${recentlyUsedPokemonRef.current.size} total)`);
        console.log(`🆔 This battle's Pokémon IDs: ${battlePokemon.map(p => p.id).join(', ')}`);
        
        return battlePokemon;
      } else {
        console.error("Battle starter not initialized");
        // Initialize with random pokemon as fallback, avoiding recently used ones
        if (allPokemon && allPokemon.length >= 2) {
          // Filter out recently used Pokémon AND last battle Pokémon
          let availablePokemon = allPokemon.filter(p => 
            !recentlyUsedPokemonRef.current.has(p.id) &&
            !lastBattlePokemonRef.current.has(p.id)
          );
          
          // If we filtered out too many, just use all except last battle
          if (availablePokemon.length < (battleType === "pairs" ? 4 : 6)) {
            availablePokemon = allPokemon.filter(p => !lastBattlePokemonRef.current.has(p.id));
          }
          
          // Last resort - use all Pokémon
          if (availablePokemon.length < (battleType === "pairs" ? 2 : 3)) {
            availablePokemon = allPokemon;
            // Reset tracking if we had to fall back
            recentlyUsedPokemonRef.current.clear();
            lastBattlePokemonRef.current.clear();
          }
          
          const shuffled = shuffleArray(availablePokemon);
          const selectedForBattle = shuffled.slice(0, battleType === "pairs" ? 2 : 3);
          
          // Clear last battle and track new ones
          lastBattlePokemonRef.current.clear();
          
          // Track these as recently used and last battle
          selectedForBattle.forEach(p => {
            recentlyUsedPokemonRef.current.add(p.id);
            lastBattlePokemonRef.current.add(p.id);
          });
          
          console.log("Fallback battle started with pokemon:", selectedForBattle.map(p => p.name));
          console.log(`🆔 Fallback battle Pokémon IDs: ${selectedForBattle.map(p => p.id).join(', ')}`);
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
        // Filter out recently used Pokémon AND last battle for the emergency battle
        let availablePokemon = allPokemon.filter(p => 
          !recentlyUsedPokemonRef.current.has(p.id) &&
          !lastBattlePokemonRef.current.has(p.id)
        );
        
        // If filtering left too few, just avoid last battle
        if (availablePokemon.length < 4) {
          availablePokemon = allPokemon.filter(p => !lastBattlePokemonRef.current.has(p.id));
        }
        
        // Last resort
        if (availablePokemon.length < 2) {
          availablePokemon = allPokemon;
          recentlyUsedPokemonRef.current.clear();
          lastBattlePokemonRef.current.clear();
        }
        
        const shuffled = shuffleArray(availablePokemon);
        const battleSize = battleType === "triplets" ? 3 : 2;
        if (shuffled.length >= battleSize) {
          const selectedForBattle = shuffled.slice(0, battleSize);
          
          // Clear last battle and track new ones
          lastBattlePokemonRef.current.clear();
          
          // Track these as recently used and last battle
          selectedForBattle.forEach(p => {
            recentlyUsedPokemonRef.current.add(p.id);
            lastBattlePokemonRef.current.add(p.id);
          });
          
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
  }, [battleStarter, setCurrentBattle, allPokemon, setSelectedPokemon, shuffleArray]);

  return {
    battleStarter,
    startNewBattle
  };
};
