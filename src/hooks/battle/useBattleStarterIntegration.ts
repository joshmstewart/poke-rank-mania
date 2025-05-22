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
  const suggestionPriorityEnabledRef = useRef(true);
  const totalSuggestionsRef = useRef(0);
  const forcedPriorityBattlesRef = useRef(0);

  useEffect(() => {
    const handlePrioritize = () => {
      suggestionBattleCountRef.current = 0;
      suggestionPriorityEnabledRef.current = true;
      processedSuggestionBattlesRef.current.clear();

      const suggestedPokemon = currentRankings.filter(
        p => p.suggestedAdjustment && !p.suggestedAdjustment.used
      );
      totalSuggestionsRef.current = suggestedPokemon.length;
      forcedPriorityBattlesRef.current = Math.max(15, suggestedPokemon.length * 3);

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

    const shouldForcePriority = forcedPriorityBattlesRef.current > 0;

    const battle = battleStarter.startNewBattle(
      battleType,
      shouldForcePriority
    );

    const hasSuggestionInBattle = battle.some(pokemon => {
      const rankedPokemon = currentRankings.find(p => p.id === pokemon.id);
      return rankedPokemon?.suggestedAdjustment && !rankedPokemon.suggestedAdjustment.used;
    });

    if (forcedPriorityBattlesRef.current > 0 && !hasSuggestionInBattle) {
      forcedPriorityBattlesRef.current--;
    }

    if (hasSuggestionInBattle) {
      suggestionBattleCountRef.current++;
      battle.forEach(pokemon => {
        const rankedPokemon = currentRankings.find(p => p.id === pokemon.id);
        if (rankedPokemon?.suggestedAdjustment) {
          processedSuggestionBattlesRef.current.add(pokemon.id);
        }
      });
    }

    return battle;
  }, [battleStarter, currentRankings]);

  const resetSuggestionPriorityExplicitly = () => {
    suggestionBattleCountRef.current = 0;
    suggestionPriorityEnabledRef.current = true;
    processedSuggestionBattlesRef.current.clear();
    forcedPriorityBattlesRef.current = Math.max(15, totalSuggestionsRef.current * 3);
  };

  const forceBattleWithPokemon = (pokemonId: number, times: number) => {
    if (battleStarter) {
      battleStarter.forcePokemonIntoNextBattles(pokemonId, times);
    }
  };

 return {
  battleStarter,
  startNewBattle: startNewBattle || (() => []),
  resetSuggestionPriority: resetSuggestionPriorityExplicitly,
  forceBattleWithPokemon: (pokemonId: number, times: number) => {
    if (battleStarter && battleStarter.selectSuggestedPokemonForced) {
      for (let i = 0; i < times; i++) {
        battleStarter.selectSuggestedPokemonForced("pairs");
      }
    }
  }
};

};
