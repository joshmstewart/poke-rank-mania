
import { useState, useEffect } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { LoadingType } from "./types";

export const useRankingState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [availablePokemon, setAvailablePokemon] = useState<Pokemon[]>([]);
  const [rankedPokemon, setRankedPokemon] = useState<RankedPokemon[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<Record<number, number>>({});
  const [selectedGeneration, setSelectedGeneration] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loadSize, setLoadSize] = useState(150);
  const [loadingType, setLoadingType] = useState<LoadingType>("pagination");

  // 🚨🚨🚨 ULTRA CRITICAL STATE CHANGE TRACKING
  console.log(`🔍🔍🔍 [RANKING_STATE_HOOK] ===== STATE CHANGE TRACKING =====`);
  console.log(`🔍🔍🔍 [RANKING_STATE] availablePokemon: ${availablePokemon.length}`);
  console.log(`🔍🔍🔍 [RANKING_STATE] rankedPokemon: ${rankedPokemon.length}`);
  
  if (rankedPokemon.length > 0) {
    console.log(`🚨🚨🚨 [STATE_CRITICAL] RANKED POKEMON IN STATE: ${rankedPokemon.length}`);
    console.log(`🚨🚨🚨 [STATE_CRITICAL] Call stack when detected:`, new Error().stack);
  }

  // 🚨 CRITICAL: Track any external state changes to rankedPokemon
  useEffect(() => {
    console.log(`🚨🚨🚨 [STATE_CHANGE_DETECTOR] rankedPokemon changed to: ${rankedPokemon.length}`);
    if (rankedPokemon.length > 0) {
      console.log(`🚨🚨🚨 [STATE_CHANGE_DETECTOR] NEW RANKED POKEMON DATA:`);
      console.log(`🚨🚨🚨 [STATE_CHANGE_DETECTOR] IDs: ${rankedPokemon.slice(0, 10).map(p => p.id).join(', ')}`);
      console.log(`🚨🚨🚨 [STATE_CHANGE_DETECTOR] Names: ${rankedPokemon.slice(0, 5).map(p => p.name).join(', ')}`);
      console.log(`🚨🚨🚨 [STATE_CHANGE_DETECTOR] Call stack:`, new Error().stack);
    }
  }, [rankedPokemon.length]);

  return {
    isLoading,
    availablePokemon,
    rankedPokemon,
    confidenceScores,
    selectedGeneration,
    currentPage,
    totalPages,
    loadSize,
    loadingType,
    setIsLoading,
    setAvailablePokemon,
    setRankedPokemon,
    setConfidenceScores,
    setSelectedGeneration,
    setCurrentPage,
    setTotalPages,
    setLoadSize,
    setLoadingType
  };
};
