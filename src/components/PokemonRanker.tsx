
import React, { useState, useEffect } from "react";
import { RankingUI } from "./ranking/RankingUI";
import { usePokemonRanker } from "@/hooks/usePokemonRanker";
import { useGenerationState } from "@/hooks/battle/useGenerationState";
import { useTrueSkillSync } from "@/hooks/ranking/useTrueSkillSync";

export default function PokemonRanker() {
  const { selectedGeneration, setSelectedGeneration } = useGenerationState();
  
  const {
    isLoading,
    availablePokemon,
    rankedPokemon: originalRankedPokemon,
    setAvailablePokemon,
    setRankedPokemon,
    loadingType,
    loadSize,
    currentPage,
    totalPages,
    loadingRef,
    handlePageChange,
    getPageRange,
    resetRankings
  } = usePokemonRanker();

  // CRITICAL FIX: Use TrueSkill sync to get the actual ranked Pokemon
  const { localRankings } = useTrueSkillSync(true); // preventAutoResorting = true for manual mode

  console.log('🎯 [POKEMON_RANKER] Original ranked Pokemon:', originalRankedPokemon.length);
  console.log('🎯 [POKEMON_RANKER] TrueSkill ranked Pokemon:', localRankings.length);

  // Use TrueSkill rankings if available, otherwise fall back to original
  const effectiveRankedPokemon = localRankings.length > 0 ? localRankings : originalRankedPokemon;

  console.log('🎯 [POKEMON_RANKER] Using effective ranked Pokemon:', effectiveRankedPokemon.length);

  const handleGenerationChange = (gen: number) => {
    setSelectedGeneration(gen);
  };

  const handleReset = () => {
    resetRankings();
  };

  return (
    <RankingUI
      isLoading={isLoading}
      availablePokemon={availablePokemon}
      rankedPokemon={effectiveRankedPokemon}
      selectedGeneration={selectedGeneration}
      loadingType={loadingType}
      currentPage={currentPage}
      totalPages={totalPages}
      loadSize={loadSize}
      loadingRef={loadingRef}
      setAvailablePokemon={setAvailablePokemon}
      setRankedPokemon={setRankedPokemon}
      handlePageChange={handlePageChange}
      getPageRange={getPageRange}
      onGenerationChange={handleGenerationChange}
      onReset={handleReset}
    />
  );
}
