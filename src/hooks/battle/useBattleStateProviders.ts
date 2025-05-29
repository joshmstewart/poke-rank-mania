
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useRankings } from "./useRankings";
import { useBattleCoordination } from "./useBattleCoordination";

export const useBattleStateProviders = (
  selectedGeneration: number,
  battleResults: any[],
  currentBattle: Pokemon[],
  stableSetCurrentBattle: (battle: Pokemon[]) => void,
  stableSetSelectedPokemon: (pokemon: number[]) => void,
  activeTier: string
) => {
  const {
    finalRankings = [],
    confidenceScores,
    activeTier: rankingActiveTier,
    setActiveTier,
    freezePokemonForTier,
    isPokemonFrozenForTier,
    allRankedPokemon
  } = useRankings();

  // Create string-compatible wrapper for freezePokemonForTier
  const freezePokemonForTierStringWrapper = useCallback((pokemonId: number, tier: string) => {
    // Convert string back to TopNOption for the original function
    const topNTier = tier === "All" ? "All" : Number(tier);
    freezePokemonForTier(pokemonId, topNTier as any);
  }, [freezePokemonForTier]);

  // Use the coordination hook
  const coordinationData = useBattleCoordination(
    selectedGeneration,
    battleResults,
    finalRankings,
    currentBattle,
    stableSetCurrentBattle,
    stableSetSelectedPokemon,
    typeof activeTier === 'string' ? activeTier : String(activeTier),
    freezePokemonForTierStringWrapper
  );

  return {
    finalRankings,
    confidenceScores,
    activeTier: rankingActiveTier,
    setActiveTier,
    freezePokemonForTier,
    isPokemonFrozenForTier,
    allRankedPokemon,
    freezePokemonForTierStringWrapper,
    refinementQueue: coordinationData.refinementQueue, // Add refinement queue to return object
    ...coordinationData
  };
};
