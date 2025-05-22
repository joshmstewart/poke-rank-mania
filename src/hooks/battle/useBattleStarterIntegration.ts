
import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { createBattleStarter } from "./createBattleStarter";
import { useBattleEmergencyReset } from "./useBattleEmergencyReset";
import { toast } from "@/hooks/use-toast";
import { RankedPokemon } from "@/services/pokemon/types";

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
  // Added flag to prevent re-triggering priority mode unintentionally
  const priorityModeActivelyRunningRef = useRef(false);
  // Track battle count to persist across renders and milestones
  const [battleCount, setBattleCount] = useState(() => {
    const savedCount = localStorage.getItem('pokemon-battle-count');
    return savedCount ? parseInt(savedCount, 10) : 0;
  });
  
  // Persist battle count to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('pokemon-battle-count', battleCount.toString());
    console.log(`🔢 Battle count persisted: ${battleCount}`);
  }, [battleCount]);
  
  // Track available suggestions for debugging
  const unusedSuggestionsRef = useRef<RankedPokemon[]>([]);
  
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
      unusedSuggestionsRef.current = suggestedPokemon;
      totalSuggestionsRef.current = suggestedPokemon.length;
      
      // Force high priority for next battles to ensure suggestions are used
      forcedPriorityBattlesRef.current = Math.min(100, Math.max(20, suggestedPokemon.length * 5));
      
      // Set active flag to prevent unnecessary reactivation
      priorityModeActivelyRunningRef.current = true;
      
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
  
  // CRITICALLY MODIFIED: This effect only runs when currentRankings changes significantly
  // Not on every render or battle completion
  useEffect(() => {
    // Only run this effect if we're not already in an active priority mode
    // This prevents the priority from being reset after every battle
    if (!priorityModeActivelyRunningRef.current) {
      const pokemonWithSuggestions = currentRankings.filter(
        p => p.suggestedAdjustment && !p.suggestedAdjustment.used
      );
      
      if (pokemonWithSuggestions.length > 0) {
        console.log(`🎯 Found ${pokemonWithSuggestions.length} Pokemon with pending suggestions`);
        unusedSuggestionsRef.current = pokemonWithSuggestions;
        
        // Always reset suggestion priority when new suggestions appear
        suggestionBattleCountRef.current = 0;
        suggestionPriorityEnabledRef.current = true;
        totalSuggestionsRef.current = pokemonWithSuggestions.length;

        // Significantly increase forced priority battles to ensure ALL suggestions get used
        forcedPriorityBattlesRef.current = Math.min(100, Math.max(50, pokemonWithSuggestions.length * 8));
        
        // Set active flag to prevent unnecessary reactivation
        priorityModeActivelyRunningRef.current = true;

        console.log(`🎮 Suggestion priority reset: prioritizing for next ${forcedPriorityBattlesRef.current} battles.`);
      }
    }
  }, [currentRankings]);
  
  const battleStarter = useMemo(() => {
    if (!allPokemon || allPokemon.length === 0) return null;

    const pokemonWithSuggestions = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
    
    console.log(`🎯 Found ${pokemonWithSuggestions.length} Pokemon with pending suggestions`);
    unusedSuggestionsRef.current = pokemonWithSuggestions;
    totalSuggestionsRef.current = pokemonWithSuggestions.length;

    // Determine direction based on suggestion or default
    const direction = 'up'; // Default to moving up if no specific direction
    
    // IMPORTANT: Only force priority if we have active battles remaining AND unused suggestions
    const shouldForcePriority = 
      forcedPriorityBattlesRef.current > 0 && 
      pokemonWithSuggestions.length > 0 && 
      priorityModeActivelyRunningRef.current;
    
    console.log(`[battleStarter] Creating battle starter with forceSuggestionPriority=${shouldForcePriority}, forcedPriorityBattlesRemaining=${forcedPriorityBattlesRef.current}, unusedSuggestions=${pokemonWithSuggestions.length}`);
    
    // Create battle starter with needed parameters
    return createBattleStarter(
      setCurrentBattle,
      currentRankings,
      shouldForcePriority,
      direction,
      allPokemon
    );
  }, [allPokemon, currentRankings, setCurrentBattle]);

  // Override startNewBattle to ensure suggestion prioritization
  const startNewBattle = useCallback((battleType: BattleType): Pokemon[] => {
    if (!battleStarter) return [];

    // Find Pokémon with pending suggestions
    const suggestedPokemon = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
    unusedSuggestionsRef.current = suggestedPokemon;

    // Log suggestion priority status clearly
    console.log(`[useBattleStarterIntegration] About to start new battle. isSuggestionPriorityModeActive: ${priorityModeActivelyRunningRef.current}, forcedPriorityBattlesRemaining: ${forcedPriorityBattlesRef.current}, unusedSuggestionsCount: ${suggestedPokemon.length}`);
    console.log(`🔄 Suggestion priority enabled: ${suggestionPriorityEnabledRef.current ? "YES ✅" : "NO ❌"}`);
    console.log(`🔢 Suggestion battles since milestone: ${suggestionBattleCountRef.current}`);
    console.log(`⚡ Forced priority battles remaining: ${forcedPriorityBattlesRef.current}`);
    console.log(`🎮 Current battle count: ${battleCount}`);
    console.log(`🎯 Unused suggestions remaining: ${suggestedPokemon.length}`);

    // Check if we should disable suggestion priority (all suggestions used)
    if (suggestedPokemon.length === 0 && priorityModeActivelyRunningRef.current) {
      console.log(`❗ All suggestions have been used, deactivating priority mode`);
      priorityModeActivelyRunningRef.current = false;
      forcedPriorityBattlesRef.current = 0;
    }

    // Check explicitly if we need forced suggestion priority
    const shouldForcePriority = 
      forcedPriorityBattlesRef.current > 0 && 
      suggestedPokemon.length > 0 && 
      priorityModeActivelyRunningRef.current;
    
    // If we're forcing priority, log it prominently
    if (shouldForcePriority) {
      console.log(`🚨 FORCING SUGGESTION PRIORITY - ${forcedPriorityBattlesRef.current} forced battles remaining`);
    }

    // Create the battle with our flag for forced priority
    const battle = battleStarter.startNewBattle();
    
    // Increment the battle count
    setBattleCount(prev => prev + 1);

    // Explicitly check if the battle has any suggestions
    const hasSuggestionInBattle = battle.some(pokemon => {
      const rankedPokemon = currentRankings.find(p => p.id === pokemon.id);
      return rankedPokemon?.suggestedAdjustment && !rankedPokemon.suggestedAdjustment.used;
    });

    // Decrease forced priority counter ONLY after each battle
    if (forcedPriorityBattlesRef.current > 0) {
      forcedPriorityBattlesRef.current--;
      console.log(`⚡ Forced priority battles decreased. Remaining: ${forcedPriorityBattlesRef.current}`);
      
      // If our counter reaches zero, deactivate priority mode
      if (forcedPriorityBattlesRef.current === 0) {
        console.log(`⚫ Forced priority battles exhausted, deactivating priority mode`);
        priorityModeActivelyRunningRef.current = false;
      }
    }

    // Increment suggestion battle counter clearly when priority active or suggestion in battle
    if (shouldForcePriority || hasSuggestionInBattle) {
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
      
      // If any suggestion Pokémon is in this battle, show a toast notification
      const suggestedPokemonInBattle = battle.find(p => 
        suggestedPokemon.some(sp => sp.id === p.id)
      );
      
      if (suggestedPokemonInBattle) {
        const suggestion = suggestedPokemon.find(sp => sp.id === suggestedPokemonInBattle.id)?.suggestedAdjustment;
        if (suggestion) {
          toast({
            title: `Suggestion battle: ${suggestedPokemonInBattle.name}`,
            description: `Adjusting rank ${suggestion.direction === "up" ? "upward" : "downward"}`,
            duration: 3000
          });
        }
      }
    } else {
      console.log("🎮 Using standard battle selection (no suggestions this battle)");
      
      // If we have suggestions but none appeared in the battle despite forced priority,
      // log a warning for debugging
      if (shouldForcePriority && suggestedPokemon.length > 0) {
        console.warn("⚠️ WARNING: Forced priority enabled but no suggestions in battle!");
        console.warn(`Available suggestions: ${suggestedPokemon.map(p => p.id).join(',')}`);
        console.warn(`Battle Pokémon: ${battle.map(p => p.id).join(',')}`);
      }
    }

    return battle;
  }, [battleStarter, currentRankings, battleCount, setBattleCount]);

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
    
    // Get count of unused suggestions
    const unusedSuggestions = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
    unusedSuggestionsRef.current = unusedSuggestions;
    
    // Set an even higher forced priority count to ensure suggestions are used
    forcedPriorityBattlesRef.current = Math.min(100, Math.max(50, unusedSuggestions.length * 8));
    
    // IMPORTANT: Explicitly activate the priority mode
    priorityModeActivelyRunningRef.current = true;
    
    lastPriorityResetTimestampRef.current = Date.now();
    console.log(`⚡ Explicitly reset and forced suggestion prioritization for next ${forcedPriorityBattlesRef.current} battles`);
    
    // Explicitly call reset method after prioritization
    if (battleStarter?.resetStateAfterMilestone) {
      battleStarter.resetStateAfterMilestone();
      console.log("🚩 Explicitly reset battle starter state after suggestion priority reset");
    }
  };

  // Emergency reset should reset the battle counter to 10
  const performEmergencyResetWithCounter = () => {
    // Reset explicitly to 10 to ensure we're in the main selection phase
    console.log(`🚩 Emergency reset triggered at battleCount=${battleCount}, explicitly resetting to 10`);
    setBattleCount(10);
    performEmergencyReset();
    
    // Also reset other tracking mechanisms
    resetSuggestionPriorityExplicitly();
  };

  return {
    battleStarter,
    startNewBattle: startNewBattle || (() => []),
    resetSuggestionPriority: resetSuggestionPriorityExplicitly,
    performEmergencyReset: performEmergencyResetWithCounter,
    battleCount
  };
};
