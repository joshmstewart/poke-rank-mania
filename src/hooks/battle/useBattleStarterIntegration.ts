
import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { createBattleStarter } from "./createBattleStarter";
import { useBattleEmergencyReset } from "./useBattleEmergencyReset";
import { toast } from "@/hooks/use-toast";

export const useBattleStarterIntegration = (
  allPokemon: Pokemon[],
  currentRankings: RankedPokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  // Track whether we've already processed suggestion priority battles
  const processedSuggestionBattlesRef = useRef<Set<number>>(new Set());
  // Track how many suggestion battles we've processed after each milestone
  const suggestionBattleCountRef = useRef(0);
  // Enhanced tracking of suggestion prioritization
  const suggestionPriorityEnabledRef = useRef(true);
  
  // This effect runs when the component mounts and sets up event listeners
  useEffect(() => {
    // When a "prioritizeSuggestions" event fires, reset our battle counter and enable priority
    const handlePrioritize = () => {
      console.log("🔥 Explicitly prioritizing suggestions for upcoming battles");
      suggestionBattleCountRef.current = 0;
      suggestionPriorityEnabledRef.current = true;
      processedSuggestionBattlesRef.current.clear();
    };

    // Listen for the custom event to prioritize suggestions
    window.addEventListener("prioritizeSuggestions", handlePrioritize);
    window.addEventListener("milestoneEnded", handlePrioritize);

    return () => {
      window.removeEventListener("prioritizeSuggestions", handlePrioritize);
      window.removeEventListener("milestoneEnded", handlePrioritize);
    };
  }, []);
  
  const battleStarter = useMemo(() => {
    if (!allPokemon || allPokemon.length === 0) return null;

    const pokemonWithSuggestions = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
    
    console.log(`🎯 Found ${pokemonWithSuggestions.length} Pokemon with pending suggestions`);
    
    // Reset suggestion battle counter when suggestions change
    if (pokemonWithSuggestions.length > 0) {
      // Only reset if we find new suggestions that weren't processed before
      const newSuggestions = pokemonWithSuggestions.filter(p => !processedSuggestionBattlesRef.current.has(p.id));
      
      if (newSuggestions.length > 0) {
        console.log(`🎮 Found ${newSuggestions.length} NEW suggestion battles to prioritize`);
        suggestionBattleCountRef.current = 0;
        suggestionPriorityEnabledRef.current = true;
      }
    }
    
    // Enhanced battle starter with suggestion prioritization
    return createBattleStarter(
      allPokemon,
      allPokemon,
      currentRankings,
      setCurrentBattle,
      pokemonWithSuggestions
    );
  }, [allPokemon, currentRankings, setCurrentBattle]);

  // Override startNewBattle to ensure suggestion prioritization
  const startNewBattle = useCallback((battleType: BattleType) => {
    if (!battleStarter) return [];
    
    // Find any Pokemon with pending suggestions
    const suggestedPokemon = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
    
    // Log our suggestion priority status
    console.log(`🔄 Suggestion priority enabled: ${suggestionPriorityEnabledRef.current ? "YES ✅" : "NO ❌"}`);
    console.log(`🔢 Suggestion battles since milestone: ${suggestionBattleCountRef.current}`);
    
    // If we have suggestions that haven't been fully processed yet AND priority is enabled
    // We'll prioritize for at least 10 battles after a milestone
    if (suggestedPokemon.length > 0 && 
        suggestionPriorityEnabledRef.current && 
        suggestionBattleCountRef.current < Math.max(10, suggestedPokemon.length * 2)) {
        
      console.log(`🔄 Prioritizing suggestion battles (${suggestionBattleCountRef.current + 1}/${Math.max(10, suggestedPokemon.length * 2)})`);
      
      // Force a high probability of suggestion battle by calling original function with a flag
      const battle = battleStarter.startNewBattle(battleType, true);
      
      // Increment counter to track how many suggestion-focused battles we've done
      suggestionBattleCountRef.current++;
      
      // Mark any suggested Pokemon in this battle as processed
      battle.forEach(pokemon => {
        const rankedPokemon = currentRankings.find(p => p.id === pokemon.id);
        if (rankedPokemon?.suggestedAdjustment) {
          processedSuggestionBattlesRef.current.add(pokemon.id);
        }
      });
      
      // Check if we have suggestions in this battle
      const hasSuggestion = battle.some(pokemon => {
        const rankedPokemon = currentRankings.find(p => p.id === pokemon.id);
        return rankedPokemon?.suggestedAdjustment && !rankedPokemon.suggestedAdjustment.used;
      });
      
      if (hasSuggestion) {
        console.log("🎯 This battle includes a Pokemon with active suggestion");
      }
      
      // If we've processed enough battles, disable priority for a while
      if (suggestionBattleCountRef.current >= Math.max(10, suggestedPokemon.length * 2)) {
        console.log("🔄 Suggestion priority battles completed for this session");
        // We'll re-enable on next milestone or explicit prioritization event
      }
      
      return battle;
    }
    
    // If we've processed all the suggestion-priority battles or have no suggestions,
    // proceed with normal battle selection
    return battleStarter.startNewBattle(battleType, false);
  }, [battleStarter, currentRankings]);

  const { performEmergencyReset } = useBattleEmergencyReset(
    [] as Pokemon[],
    setCurrentBattle,
    allPokemon
  );

  return {
    battleStarter,
    startNewBattle: startNewBattle || (() => []),
    resetSuggestionPriority: () => {
      suggestionBattleCountRef.current = 0;
      suggestionPriorityEnabledRef.current = true;
      processedSuggestionBattlesRef.current.clear();
    }
  };
};
