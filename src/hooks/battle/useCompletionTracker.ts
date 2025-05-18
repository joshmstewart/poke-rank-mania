import { useState, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleResult } from "./types";
import { toast } from "@/hooks/use-toast";

export const useCompletionTracker = (
  allPokemon: Pokemon[],
  battleResults: BattleResult,
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  generateRankings: (results: BattleResult) => void,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>
) => {
  const [currentRankingGenerated, setCurrentRankingGenerated] = useState(false);

  useEffect(() => {
    calculateCompletionPercentage();
  }, [battleResults?.length]);

  const calculateCompletionPercentage = () => {
    const total = allPokemon?.length || 0;
    if (!total || total <= 1) {
      setCompletionPercentage(100);
      return;
    }

    // Build a map of which Pokémon has been compared to which others
    const comparisonMap = new Map<number, Set<number>>();

    battleResults?.forEach(result => {
      const participants = result.battle.map(p => p.id);

      for (const id of participants) {
        if (!comparisonMap.has(id)) {
          comparisonMap.set(id, new Set());
        }

        for (const opponentId of participants) {
          if (id !== opponentId) {
            comparisonMap.get(id)!.add(opponentId);
          }
        }
      }
    });

    // A Pokémon is "rankable" if it's been compared to at least 30% of the others
    const threshold = Math.floor(total * 0.3);
    let rankableCount = 0;

    for (const id of comparisonMap.keys()) {
      if (comparisonMap.get(id)!.size >= threshold) {
        rankableCount++;
      }
    }

    const percent = Math.round((rankableCount / total) * 100);
    setCompletionPercentage(percent);

    console.log(`[useCompletionTracker] ${rankableCount}/${total} Pokémon are rankable → ${percent}%`);

    if (percent >= 100 && !currentRankingGenerated) {
      console.log("[useCompletionTracker] 100% completion reached - generating final rankings");
      generateRankings(battleResults);
      setRankingGenerated(true);
      setCurrentRankingGenerated(true);

      toast({
        title: "Complete Ranking Achieved!",
        description: "You've compared enough Pokémon to generate a full ranking!",
      });
    }
  };

  const getBattlesRemaining = () => {
    const total = allPokemon?.length || 0;
    if (total <= 1) return 0;

    const threshold = Math.floor(total * 0.3);
    const comparisonMap = new Map<number, Set<number>>();

    battleResults?.forEach(result => {
      const participants = result.battle.map(p => p.id);

      for (const id of participants) {
        if (!comparisonMap.has(id)) {
          comparisonMap.set(id, new Set());
        }

        for (const opponentId of participants) {
          if (id !== opponentId) {
            comparisonMap.get(id)!.add(opponentId);
          }
        }
      }
    });

    let unrankedCount = 0;

    for (const id of allPokemon.map(p => p.id)) {
      if (!comparisonMap.has(id) || comparisonMap.get(id)!.size < threshold) {
        unrankedCount++;
      }
    }

    return unrankedCount; // Number of Pokémon still needing more comparisons
  };

  return {
    setCompletionPercentage,
    calculateCompletionPercentage,
    getBattlesRemaining
  };
};
