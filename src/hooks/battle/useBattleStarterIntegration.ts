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
  // Track when was the last time we reset suggestion priority
  const lastPriorityResetTimestampRef = useRef(Date.now());
  // Enhanced tracking of suggestion prioritization
  const suggestionPriorityEnabledRef = useRef(true);
  // Track the total number of suggestions available
  const totalSuggestionsRef = useRef(0);
  // Force high priority for a specific number of battles after milestone
  const forcedPriorityBattlesRef = useRef(0);
  
  // This effect runs when the component mounts and sets up event listeners
  useEffect(() => {
    // When a "prioritizeSuggestions" event fires, reset our battle counter and enable priority
    const handlePrioritize = () => {
      console.log("🔥 Explicitly prioritizing suggestions for upcoming battles");
      suggestionBattleCountRef.current = 0;
      suggestionPriorityEnabledRef.current = true;
      processedSuggestionBattlesRef.current.clear();
      lastPriorityResetTimestampRef.current = Date.now();
      
      // Count total available suggestions
      const suggestedPokemon = currentRankings.filter(
        p => p.suggestedAdjustment && !p.suggestedAdjustment.used
      );
      totalSuggestionsRef.current = suggestedPokemon.length;
      
      // Force high priority for next 5-10 battles to ensure suggestions are used
      forcedPriorityBattlesRef.current = Math.min(15, Math.max(5, suggestedPokemon.length * 2));
      
      if (totalSuggestionsRef.current > 0) {
        toast({
          title: "Prioritizing suggestions",
          description: `Focusing on ${totalSuggestionsRef.current} suggestion(s) for next ${forcedPriorityBattlesRef.current} battles`,
          duration: 4000
        });
        console.log(`⚡ Forcing suggestion priority for next ${forcedPriorityBattlesRef.current} battles`);
      }
    };

    // Listen for the custom event to prioritize suggestions
    window.addEventListener("prioritizeSuggestions", handlePrioritize);
    window.addEventListener("milestoneEnded", handlePrioritize);

    return () => {
      window.removeEventListener("prioritizeSuggestions", handlePrioritize);
      window.removeEventListener("milestoneEnded", handlePrioritize);
    };
  }, [currentRankings]);
  
  // Update the effect that monitors for changes in suggestions
  useEffect(() => {
    const pokemonWithSuggestions = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
    
    if (pokemonWithSuggestions.length > 0) {
      console.log(`🎯 Found ${pokemonWithSuggestions.length} Pokemon with pending suggestions`);
      
      // Check if we have new suggestions we haven't seen before
      const newSuggestionsCount = pokemonWithSuggestions.filter(
        p => !processedSuggestionBattlesRef.current.has(p.id)
      ).length;
      
      if (newSuggestionsCount > 0) {
        console.log(`🎮 Found ${newSuggestionsCount} NEW suggestion battles to prioritize`);
        suggestionBattleCountRef.current = 0;
        suggestionPriorityEnabledRef.current = true;
        totalSuggestionsRef.current = pokemonWithSuggestions.length;
        
        // Force high priority for these new suggestions
        forcedPriorityBattlesRef.current = Math.min(10, Math.max(5, newSuggestionsCount * 2));
      }
    }
  }, [currentRankings]);
  
  const battleStarter = useMemo(() => {
    if (!allPokemon || allPokemon.length === 0) return null;

    const pokemonWithSuggestions = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
    
    console.log(`🎯 Found ${pokemonWithSuggestions.length} Pokemon with pending suggestions`);
    totalSuggestionsRef.current = pokemonWithSuggestions.length;
    
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
    console.log(`⚡ Forced priority battles remaining: ${forcedPriorityBattlesRef.current}`);
    
    // Calculate how many priority battles we should do based on suggestion count
    // Use a minimum of 10 battles or 2x the number of suggestions, whichever is greater
    const requiredPriorityBattles = Math.max(10, suggestedPokemon.length * 3);
    
    // Check if we need to force a suggestion priority battle
    const shouldForcePriority = forcedPriorityBattlesRef.current > 0;
    
    // If we should force a priority battle OR we have suggestions and priority is enabled
    if (shouldForcePriority || 
        (suggestedPokemon.length > 0 && 
         suggestionPriorityEnabledRef.current && 
         suggestionBattleCountRef.current < requiredPriorityBattles)) {
        
      console.log(`🔄 Prioritizing suggestion battles (${suggestionBattleCountRef.current + 1}/${requiredPriorityBattles})`);
      
      // Decrease the forced priority counter if applicable
      if (forcedPriorityBattlesRef.current > 0) {
        forcedPriorityBattlesRef.current--;
        console.log(`⚡ Forced priority battles remaining: ${forcedPriorityBattlesRef.current}`);
      }
      
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
      if (!shouldForcePriority && suggestionBattleCountRef.current >= requiredPriorityBattles) {
        console.log("🔄 Regular suggestion priority battles completed for this session");
        // But keep the forced priority if it's still active
      }
      
      return battle;
    }
    
    // If we've processed all the suggestion-priority battles or have no suggestions,
    // proceed with normal battle selection
    console.log("🎮 Using standard battle selection (no suggestion priority)");
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
      lastPriorityResetTimestampRef.current = Date.now();
      // Force high priority for next several battles
      forcedPriorityBattlesRef.current = 10;
      console.log("⚡ Forcing suggestion priority for next 10 battles via reset");
    }
  };
};
