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

    // Always reset suggestion priority when new suggestions appear or persist
    suggestionBattleCountRef.current = 0;
    suggestionPriorityEnabledRef.current = true;
    totalSuggestionsRef.current = pokemonWithSuggestions.length;

    // Consistently prioritize suggestions for a longer duration
    forcedPriorityBattlesRef.current = Math.max(15, pokemonWithSuggestions.length * 5);

    console.log(`🎮 Suggestion priority reset: prioritizing for next ${forcedPriorityBattlesRef.current} battles.`);
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

  // Find Pokémon with pending suggestions
  const suggestedPokemon = currentRankings.filter(
    p => p.suggestedAdjustment && !p.suggestedAdjustment.used
  );

  // Log suggestion priority status clearly
  console.log(`🔄 Suggestion priority enabled: ${suggestionPriorityEnabledRef.current ? "YES ✅" : "NO ❌"}`);
  console.log(`🔢 Suggestion battles since milestone: ${suggestionBattleCountRef.current}`);
  console.log(`⚡ Forced priority battles remaining: ${forcedPriorityBattlesRef.current}`);

  // Calculate required priority battles explicitly
  const requiredPriorityBattles = Math.max(10, suggestedPokemon.length * 3);

  // Check explicitly if we need forced suggestion priority
  const shouldForcePriority = forcedPriorityBattlesRef.current > 0;

  // Create the battle explicitly (only declared once)
  const battle = battleStarter.startNewBattle(
    battleType,
    shouldForcePriority || (
      suggestedPokemon.length > 0 &&
      suggestionPriorityEnabledRef.current &&
      suggestionBattleCountRef.current < requiredPriorityBattles
    )
  );

  // Explicitly check if the battle has any suggestions
  const hasSuggestionInBattle = battle.some(pokemon => {
    const rankedPokemon = currentRankings.find(p => p.id === pokemon.id);
    return rankedPokemon?.suggestedAdjustment && !rankedPokemon.suggestedAdjustment.used;
  });

  // Decrease forced priority ONLY if there were NO suggestions
  if (forcedPriorityBattlesRef.current > 0 && !hasSuggestionInBattle) {
    forcedPriorityBattlesRef.current--;
    console.log(`⚡ Forced priority battles decreased (no suggestion this battle). Remaining: ${forcedPriorityBattlesRef.current}`);
  } else if (hasSuggestionInBattle) {
    console.log("🎯 Suggestion found in battle, NOT decrementing forcedPriorityBattlesRef");
  }

  // Increment suggestion battle counter clearly when priority active
  if (shouldForcePriority || (hasSuggestionInBattle && suggestionPriorityEnabledRef.current)) {
    suggestionBattleCountRef.current++;
    battle.forEach(pokemon => {
      const rankedPokemon = currentRankings.find(p => p.id === pokemon.id);
      if (rankedPokemon?.suggestedAdjustment) {
        processedSuggestionBattlesRef.current.add(pokemon.id);
      }
    });
    console.log(`🔄 Suggestion battles incremented: ${suggestionBattleCountRef.current}`);
  }

  if (hasSuggestionInBattle) {
    console.log("🎯 This battle includes Pokémon with active suggestions");
  } else {
    console.log("🎮 Using standard battle selection (no suggestions this battle)");
  }

  return battle;
}, [battleStarter, currentRankings]);


  const { performEmergencyReset } = useBattleEmergencyReset(
    [] as Pokemon[],
    setCurrentBattle,
    allPokemon
  );

 // Expose a clear method to reset suggestion priorities explicitly
const resetSuggestionPriorityExplicitly = () => {
  suggestionBattleCountRef.current = 0;
  suggestionPriorityEnabledRef.current = true;
  processedSuggestionBattlesRef.current.clear();
  forcedPriorityBattlesRef.current = Math.max(20, totalSuggestionsRef.current * 5);
  lastPriorityResetTimestampRef.current = Date.now();
  console.log("⚡ Explicitly reset and forced suggestion prioritization for next battles");
};

return {
  battleStarter,
  startNewBattle: startNewBattle || (() => []),
  resetSuggestionPriority: resetSuggestionPriorityExplicitly,
  selectSuggestedPokemonForced: battleStarter?.selectSuggestedPokemonForced,
};


};
