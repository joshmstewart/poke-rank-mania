
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
      milestoneCrossedRef.current = false;
    }

    const suggestedPokemon = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
    console.log('[DEBUG useBattleStarterIntegration] Starting new battle. Available suggestedPokemon.length:', suggestedPokemon.length);
    console.log('[DEBUG useBattleStarterIntegration] Current forcedPriorityBattlesRef.current:', forcedPriorityBattlesRef.current);

    const shouldForcePriority = forcedPriorityBattlesRef.current > 0 && suggestedPokemon.length > 0;
    console.log('[DEBUG useBattleStarterIntegration] shouldForcePriority decision:', shouldForcePriority);

    let battle: Pokemon[];
    
    // CORE BATTLE STARTER CALL
    // If we should force priority and have suggestions, do that
    if (shouldForcePriority) {
      battle = battleStarter.startNewBattle(battleType, true);
      console.log("🚨 Explicitly FORCING a suggestion-priority battle.");

      forcedPriorityBattlesRef.current--;
      console.log('[DEBUG useBattleStarterIntegration] forcedPriorityBattlesRef decremented to:', forcedPriorityBattlesRef.current);

      const hasSuggestion = battle.some(pokemon => {
        const rankedPokemon = currentRankings.find(p => p.id === pokemon.id);
        return rankedPokemon?.suggestedAdjustment && !rankedPokemon.suggestedAdjustment.used;
      });

      if (!hasSuggestion) {
        forcedPriorityBattlesRef.current++;
        console.log('[DEBUG useBattleStarterIntegration] forcedPriorityBattlesRef incremented back to:', forcedPriorityBattlesRef.current, 'as no suggestion was found');
        console.log("❌ No suggestion Pokémon found despite forced priority; NOT decrementing counter.");
      }
    } else {
      battle = battleStarter.startNewBattle(battleType, false);
      console.log("🎮 Using standard battle selection (no forced suggestions).");
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
    } else if (newPokemonCount > 0) {
      console.log(`✅ Battle introduces ${newPokemonCount} new Pokémon that weren't previously ranked.`);
    } else {
      console.log("🚫 Battle contains no suggestions and no new Pokémon explicitly.");
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
  };

  return {
    battleStarter,
    startNewBattle,
    resetSuggestionPriority: resetSuggestionPriorityExplicitly,
  };
};
