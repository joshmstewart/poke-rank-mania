
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

    window.addEventListener("prioritizeSuggestions", handlePrioritize);
    window.addEventListener("milestoneEnded", handlePrioritize);

    return () => {
      window.removeEventListener("prioritizeSuggestions", handlePrioritize);
      window.removeEventListener("milestoneEnded", handlePrioritize);
    };
  }, [currentRankings]);

  const battleStarter = useMemo(() => {
    if (!allPokemon || allPokemon.length === 0) return null;

    const pokemonWithSuggestions = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );

    totalSuggestionsRef.current = pokemonWithSuggestions.length;
    console.log('[DEBUG useBattleStarterIntegration] Identified pokemonWithSuggestions.length:', pokemonWithSuggestions.length);

    return createBattleStarter(
      allPokemon,
      allPokemon,
      currentRankings,
      setCurrentBattle,
      pokemonWithSuggestions
    );
  }, [allPokemon, currentRankings, setCurrentBattle]);

  const startNewBattle = useCallback((battleType: BattleType) => {
    if (!battleStarter) return [];

    const suggestedPokemon = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
    console.log('[DEBUG useBattleStarterIntegration] Starting new battle. Available suggestedPokemon.length:', suggestedPokemon.length);
    console.log('[DEBUG useBattleStarterIntegration] Current forcedPriorityBattlesRef.current:', forcedPriorityBattlesRef.current);

    const shouldForcePriority = forcedPriorityBattlesRef.current > 0;
    console.log('[DEBUG useBattleStarterIntegration] shouldForcePriority decision:', shouldForcePriority);

    let battle: Pokemon[];
    if (shouldForcePriority && suggestedPokemon.length > 0) {
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

    const hasSuggestionInBattle = battle.some(pokemon => {
      const rankedPokemon = currentRankings.find(p => p.id === pokemon.id);
      return rankedPokemon?.suggestedAdjustment && !rankedPokemon.suggestedAdjustment.used;
    });

    if (hasSuggestionInBattle) {
      suggestionBattleCountRef.current++;
      console.log(`✅ Battle explicitly contains suggestion (#${suggestionBattleCountRef.current} since milestone).`);
    } else {
      console.log("🚫 Battle contains no suggestions explicitly.");
    }

    setCurrentBattle(battle);
    console.log("📌 Updating current battle state explicitly with IDs:", battle.map(p => p.id));

    return battle;
  }, [battleStarter, currentRankings, setCurrentBattle]);

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
  };

  return {
    battleStarter,
    startNewBattle,
    resetSuggestionPriority: resetSuggestionPriorityExplicitly,
  };
};
