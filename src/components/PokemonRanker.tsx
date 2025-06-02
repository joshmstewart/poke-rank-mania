
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
  } = usePokemonRanker();

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
