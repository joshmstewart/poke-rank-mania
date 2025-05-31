
import React, { useState, useEffect } from "react";
import { RankingUI } from "./ranking/RankingUI";
import { usePokemonRanker } from "@/hooks/usePokemonRanker";
import { useGenerationState } from "@/hooks/battle/useGenerationState";

export default function PokemonRanker() {
  const { selectedGeneration, setSelectedGeneration } = useGenerationState();
  
  const {
    isLoading,
    availablePokemon,
    rankedPokemon,
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
  } = usePokemonRanker({
    selectedGeneration,
    onGenerationChange: setSelectedGeneration
  });

  const handleGenerationChange = (gen: number) => {
    console.log(`🔍 [POKEMON_RANKER] Generation changing from ${selectedGeneration} to ${gen}`);
    setSelectedGeneration(gen);
  };

  const handleReset = () => {
    console.log(`🔍 [POKEMON_RANKER] Reset called`);
    resetRankings();
  };

  return (
    <RankingUI
      isLoading={isLoading}
      availablePokemon={availablePokemon}
      rankedPokemon={rankedPokemon}
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
