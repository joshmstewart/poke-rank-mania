
import { useMemo, useEffect, useRef, useCallback } from "react";
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
  const processedSuggestionBattlesRef = useRef<Set<number>>(new Set());
  const suggestionBattleCountRef = useRef(0);
  const forcedPriorityBattlesRef = useRef(0);
  const totalSuggestionsRef = useRef(0);
  const milestoneCrossedRef = useRef(false);
  const priorityModeActiveRef = useRef(false); // Ref to track if priority mode is active
  const consecutiveBattlesWithoutNewPokemonRef = useRef(0); // Track battles without introducing new Pokémon

  // Log initial value of forcedPriorityBattlesRef
  console.log('[DEBUG useBattleStarterIntegration] forcedPriorityBattlesRef initialized to:', forcedPriorityBattlesRef.current);

  useEffect(() => {
    const handlePrioritize = () => {
      suggestionBattleCountRef.current = 0;
      processedSuggestionBattlesRef.current.clear();

      const suggestedPokemon = currentRankings.filter(
        p => p.suggestedAdjustment && !p.suggestedAdjustment.used
      );

      totalSuggestionsRef.current = suggestedPokemon.length;
      forcedPriorityBattlesRef.current = Math.max(20, suggestedPokemon.length * 5);
      console.log('[DEBUG useBattleStarterIntegration] forcedPriorityBattlesRef set to:', forcedPriorityBattlesRef.current, 'after prioritize trigger');
      
      // Set priority mode active flag
      priorityModeActiveRef.current = suggestedPokemon.length > 0;
      console.log('[DEBUG useBattleStarterIntegration] priorityModeActiveRef set to:', priorityModeActiveRef.current);

      // Reset consecutive battles without new Pokémon when prioritizing
      consecutiveBattlesWithoutNewPokemonRef.current = 0;

      if (totalSuggestionsRef.current > 0) {
        toast({
          title: "Prioritizing suggestions",
          description: `Focusing on ${totalSuggestionsRef.current} suggestion(s) for next ${forcedPriorityBattlesRef.current} battles`,
          duration: 4000
        });
      }
    };
    
    const handleMilestoneReached = (event: Event) => {
      console.log('[DEBUG useBattleStarterIntegration] Milestone reached event detected');
      milestoneCrossedRef.current = true;
      
      // After milestone, we want to ensure focus on unranked Pokemon
      // Reset battles without new Pokémon counter to force variety
      consecutiveBattlesWithoutNewPokemonRef.current = 0;
    };

    window.addEventListener("prioritizeSuggestions", handlePrioritize);
    window.addEventListener("milestoneEnded", handlePrioritize);
    window.addEventListener("milestoneReached", handleMilestoneReached);

    return () => {
      window.removeEventListener("prioritizeSuggestions", handlePrioritize);
      window.removeEventListener("milestoneEnded", handlePrioritize);
      window.removeEventListener("milestoneReached", handleMilestoneReached);
    };
  }, [currentRankings]);

  const battleStarter = useMemo(() => {
    if (!allPokemon || allPokemon.length === 0) return null;

    // Log detailed diagnostics about the Pokémon pools
    console.log(`[DEBUG useBattleStarterIntegration] Creating battleStarter with:`);
    console.log(`[DEBUG useBattleStarterIntegration] - allPokemon size: ${allPokemon.length}`);
    console.log(`[DEBUG useBattleStarterIntegration] - currentRankings size: ${currentRankings.length}`);
    
    // Count unranked Pokémon (in allPokemon but not in currentRankings)
    const rankedIds = new Set(currentRankings.map(p => p.id));
    const unrankedCount = allPokemon.filter(p => !rankedIds.has(p.id)).length;
    console.log(`[DEBUG useBattleStarterIntegration] - unranked Pokémon count: ${unrankedCount}`);
    
    // Detect if we have low variety in the current rankings
    if (currentRankings.length > 0 && currentRankings.length < 50 && allPokemon.length > 100) {
      console.log(`[DEBUG useBattleStarterIntegration] VARIETY WARNING: currentRankings (${currentRankings.length}) is much smaller than allPokemon (${allPokemon.length})`);
      console.log(`[DEBUG useBattleStarterIntegration] This indicates we need to draw more from unranked Pokémon`);
    }

    const pokemonWithSuggestions = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );

    totalSuggestionsRef.current = pokemonWithSuggestions.length;
    console.log('[DEBUG useBattleStarterIntegration] Identified pokemonWithSuggestions.length:', pokemonWithSuggestions.length);
    
    // CRUCIAL: Pass allPokemon to both allPokemon and availablePokemon parameters
    // This ensures createBattleStarter has access to the complete Pokémon pool
    return createBattleStarter(
      allPokemon,  // Full Pokémon pool 
      allPokemon,  // Same as full pool to ensure maximum variety
      currentRankings,
      setCurrentBattle,
      pokemonWithSuggestions
    );
  }, [allPokemon, currentRankings, setCurrentBattle]);

  const startNewBattle = useCallback((battleType: BattleType) => {
    if (!battleStarter) return [];

    // CRITICAL DIAGNOSTICS: Log pool sizes before starting battles
    console.log('[DEBUG useBattleStarterIntegration] Starting new battle with:');
    console.log(`[DEBUG useBattleStarterIntegration] - allPokemon size: ${allPokemon.length}`);
    console.log(`[DEBUG useBattleStarterIntegration] - currentRankings size: ${currentRankings.length}`);
    
    // Count truly unranked Pokémon
    const rankedIds = new Set(currentRankings.map(p => p.id));
    const unrankedPokemon = allPokemon.filter(p => !rankedIds.has(p.id));
    console.log(`[DEBUG useBattleStarterIntegration] - unranked Pokémon count: ${unrankedPokemon.length}`);
    
    // If we've crossed a milestone, ensure we prioritize unranked Pokémon
    if (milestoneCrossedRef.current) {
      console.log('[DEBUG useBattleStarterIntegration] Post-milestone battle. Will prioritize unranked Pokémon selection.');
      // Reset the milestone flag so it's only used for the immediate post-milestone battle
      milestoneCrossedRef.current = false;
      // Also reset consecutive battles without new Pokémon
      consecutiveBattlesWithoutNewPokemonRef.current = 0;
    }

    const suggestedPokemon = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
    console.log('[DEBUG useBattleStarterIntegration] Starting new battle. Available suggestedPokemon.length:', suggestedPokemon.length);
    console.log('[DEBUG useBattleStarterIntegration] Current forcedPriorityBattlesRef.current:', forcedPriorityBattlesRef.current);

    // Only force priority if we have forced battles left AND suggestions available
    const shouldForcePriority = forcedPriorityBattlesRef.current > 0 && suggestedPokemon.length > 0;
    console.log('[DEBUG useBattleStarterIntegration] shouldForcePriority decision:', shouldForcePriority);
    
    // IMPORTANT: Update priorityModeActiveRef based on whether we still have suggestions
    priorityModeActiveRef.current = suggestedPokemon.length > 0 && forcedPriorityBattlesRef.current > 0;
    console.log('[DEBUG useBattleStarterIntegration] priorityModeActiveRef updated to:', priorityModeActiveRef.current);

    let battle: Pokemon[];
    let forceUnrankedSelection = false;
    
    // CRITICAL FIX: Force unranked selection if we've gone too many battles without new Pokémon
    const MAX_BATTLES_WITHOUT_NEW_POKEMON = 3;
    if (consecutiveBattlesWithoutNewPokemonRef.current >= MAX_BATTLES_WITHOUT_NEW_POKEMON) {
      forceUnrankedSelection = true;
      console.log(`[DEBUG useBattleStarterIntegration] FORCING unranked selection after ${consecutiveBattlesWithoutNewPokemonRef.current} battles without new Pokémon`);
    }
    
    // Check if we need to force unranked Pokemon selection for variety
    // Force unranked selection if:
    // 1. We've already gone multiple battles without new Pokémon, OR
    // 2. We've just passed a milestone, OR
    // 3. The unranked pool is large compared to the ranked pool (>90%)
    if (milestoneCrossedRef.current || 
        (unrankedPokemon.length > 0 && unrankedPokemon.length > (currentRankings.length * 9))) {
      forceUnrankedSelection = true;
      console.log('[DEBUG useBattleStarterIntegration] Forcing unranked selection for variety:', forceUnrankedSelection);
    }
    
    // CRITICAL FIX: Always pass the forceUnrankedSelection flag, regardless of shouldForcePriority
    if (shouldForcePriority) {
      battle = battleStarter.startNewBattle(battleType, true, forceUnrankedSelection);
      console.log(`🚨 Explicitly FORCING a suggestion-priority battle. forceUnrankedSelection: ${forceUnrankedSelection}`);

      // Check if the battle includes a suggestion before decrementing the counter
      const battleIncludesSuggestion = battle.some(pokemon => {
        const rankedPokemon = currentRankings.find(p => p.id === pokemon.id);
        return rankedPokemon?.suggestedAdjustment && !rankedPokemon.suggestedAdjustment.used;
      });

      // FIXED: Only decrement if we successfully included a suggestion or if we attempted but failed
      if (battleIncludesSuggestion) {
        forcedPriorityBattlesRef.current--;
        console.log('[DEBUG useBattleStarterIntegration] forcedPriorityBattlesRef decremented to:', 
          forcedPriorityBattlesRef.current, 'after successfully including a suggestion');
      } else {
        console.log('[DEBUG useBattleStarterIntegration] No suggestion included in battle despite forced priority. Counter unchanged:', forcedPriorityBattlesRef.current);
        // IMPORTANT: Still decrement by at least 1 to avoid getting stuck
        // This ensures we don't endlessly try to force suggestions that can't be used
        if (forcedPriorityBattlesRef.current > 0) {
          forcedPriorityBattlesRef.current--;
          console.log('[DEBUG useBattleStarterIntegration] Decrementing counter anyway to prevent stalling:', forcedPriorityBattlesRef.current);
        }
      }
    } else {
      // Pass the forceUnrankedSelection flag to ensure variety
      battle = battleStarter.startNewBattle(battleType, false, forceUnrankedSelection);
      console.log(`🎮 Using standard battle selection (forceUnrankedSelection: ${forceUnrankedSelection})`);
    }

    // DIAGNOSTICS: Check if battle contains suggestions or new Pokémon
    const hasSuggestionInBattle = battle.some(pokemon => {
      const rankedPokemon = currentRankings.find(p => p.id === pokemon.id);
      return rankedPokemon?.suggestedAdjustment && !rankedPokemon.suggestedAdjustment.used;
    });

    // Check if we're introducing new Pokémon
    const newPokemonCount = battle.filter(pokemon => !currentRankings.some(rp => rp.id === pokemon.id)).length;

    if (hasSuggestionInBattle) {
      suggestionBattleCountRef.current++;
      console.log(`✅ Battle explicitly contains suggestion (#${suggestionBattleCountRef.current} since milestone).`);
      // Don't reset the consecutiveBattlesWithoutNewPokemonRef here - we're prioritizing suggestions
    } else if (newPokemonCount > 0) {
      console.log(`✅ Battle introduces ${newPokemonCount} new Pokémon that weren't previously ranked.`);
      // Reset the counter since we're introducing new Pokémon
      consecutiveBattlesWithoutNewPokemonRef.current = 0;
    } else {
      console.log("🚫 Battle contains no suggestions and no new Pokémon explicitly.");
      // Increment the counter since we didn't introduce new Pokémon
      consecutiveBattlesWithoutNewPokemonRef.current++;
      console.log(`⚠️ Consecutive battles without new Pokémon: ${consecutiveBattlesWithoutNewPokemonRef.current}`);
      // IMPORTANT: Force unranked next time if we've gone too many battles without new Pokémon
      if (consecutiveBattlesWithoutNewPokemonRef.current >= MAX_BATTLES_WITHOUT_NEW_POKEMON) {
        console.log(`⚠️ Will force unranked selection next battle to ensure variety`);
      }
    }

    setCurrentBattle(battle);
    console.log("📌 Updating current battle state explicitly with IDs:", battle.map(p => p.id));

    return battle;
  }, [battleStarter, currentRankings, setCurrentBattle, allPokemon]);

  const { performEmergencyReset } = useBattleEmergencyReset(
    [] as Pokemon[],
    setCurrentBattle,
    allPokemon
  );

  const resetSuggestionPriorityExplicitly = () => {
    suggestionBattleCountRef.current = 0;
    processedSuggestionBattlesRef.current.clear();
    const prevValue = forcedPriorityBattlesRef.current;
    forcedPriorityBattlesRef.current = Math.max(20, totalSuggestionsRef.current * 5);
    console.log('[DEBUG useBattleStarterIntegration] forcedPriorityBattlesRef reset from', prevValue, 'to:', forcedPriorityBattlesRef.current);
    console.log("⚡ Explicitly reset and forced suggestion prioritization for next battles");
    
    // Also set milestoneCrossedRef to true to ensure we prioritize unranked Pokémon
    milestoneCrossedRef.current = true;
    
    // Reset priority mode flag
    priorityModeActiveRef.current = true;
    console.log('[DEBUG useBattleStarterIntegration] priorityModeActiveRef reset to:', priorityModeActiveRef.current);
    
    // Reset consecutive battles without new Pokémon counter
    consecutiveBattlesWithoutNewPokemonRef.current = 0;
  };

  return {
    battleStarter,
    startNewBattle,
    resetSuggestionPriority: resetSuggestionPriorityExplicitly,
  };
};
