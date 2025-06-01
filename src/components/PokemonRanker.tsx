
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

  // 🚨🚨🚨 POKEMON RANKER COMPONENT LEVEL TRACKING
  console.log(`🔍 [POKEMON_RANKER] ===== COMPONENT LEVEL DATA TRACKING =====`);
  console.log(`🔍 [POKEMON_RANKER] Received from usePokemonRanker:`);
  console.log(`🔍 [POKEMON_RANKER] - availablePokemon: ${availablePokemon.length}`);
  console.log(`🔍 [POKEMON_RANKER] - rankedPokemon: ${rankedPokemon.length}`);
  console.log(`🔍 [POKEMON_RANKER] - selectedGeneration: ${selectedGeneration}`);
  
  if (rankedPokemon.length > 0) {
    console.log(`🚨🚨🚨 [POKEMON_RANKER_CRITICAL] RANKED POKEMON AT COMPONENT LEVEL: ${rankedPokemon.length}`);
    console.log(`🚨🚨🚨 [POKEMON_RANKER_CRITICAL] Sample IDs: ${rankedPokemon.slice(0, 10).map(p => p.id).join(', ')}`);
  }

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
