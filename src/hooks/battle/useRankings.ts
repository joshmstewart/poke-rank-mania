
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { SingleBattle } from "./types";
import { Rating } from "ts-trueskill";
import { useRankingSuggestions } from "./useRankingSuggestions";

export const useRankings = (allPokemon: Pokemon[] = []) => {
  console.log("[DEBUG useRankings] INIT - allPokemon is array:", Array.isArray(allPokemon), "length:", allPokemon?.length || 0);

  // Track component instances for debugging remounts
  const instanceIdRef = useRef(`rankings-${Date.now()}`);
  console.log(`[DEBUG useRankings] Instance: ${instanceIdRef.current} running`);
  
  const [finalRankings, setFinalRankings] = useState<RankedPokemon[]>([]);
  console.log("[DEBUG useRankings] finalRankings useState initialized:", 
              Array.isArray(finalRankings) ? `array[${finalRankings.length}]` : 'not array');
              
  const [confidenceScores, setConfidenceScores] = useState<Record<number, number>>({});
  const [activeTier, setActiveTier] = useState<TopNOption>(() => {
    const storedTier = localStorage.getItem("pokemon-active-tier");
    return storedTier ? (storedTier === "All" ? "All" : Number(storedTier) as TopNOption) : 25;
  });
  const [frozenPokemon, setFrozenPokemon] = useState<Record<number, { [tier: string]: boolean }>>({});

  // Keep track of the previous results to prevent unnecessary regeneration
  const previousRankingsRef = useRef<RankedPokemon[]>([]);
  const previousResultsRef = useRef<SingleBattle[]>([]);
  const rankingGenerationCountRef = useRef(0);

  const {
    suggestRanking,
    removeSuggestion,
    markSuggestionUsed,
    clearAllSuggestions,
    findNextSuggestion,
    loadSavedSuggestions,
    activeSuggestions
  } = useRankingSuggestions(finalRankings, setFinalRankings);

  useEffect(() => {
    const storedFrozen = localStorage.getItem("pokemon-frozen-pokemon");
    if (storedFrozen) {
      try {
        setFrozenPokemon(JSON.parse(storedFrozen));
      } catch (e) {
        console.error("Error loading frozen pokemon state:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pokemon-active-tier", activeTier.toString());
  }, [activeTier]);

  useEffect(() => {
    localStorage.setItem("pokemon-frozen-pokemon", JSON.stringify(frozenPokemon));
  }, [frozenPokemon]);

  useEffect(() => {
    if (finalRankings.length > 0) {
      previousRankingsRef.current = finalRankings;
    }
  }, [finalRankings]);

  // IMPROVED: Check for substantial changes before regenerating rankings - optimized and with type preservation
  const generateRankings = useCallback((results: SingleBattle[]): RankedPokemon[] => {
    console.log("[DEBUG useRankings] generateRankings - results is array:", Array.isArray(results), "length:", results?.length || 0);
    
    // Prevent excessive regeneration by tracking and logging call count
    rankingGenerationCountRef.current++;
    const currentCount = rankingGenerationCountRef.current;
    console.log(`[EFFECT LoopCheck - generateRankings] ENTRY #${currentCount} - Results count: ${results.length}`);

    // Check if results haven't changed substantially - avoid unnecessary regeneration
    if (results.length === previousResultsRef.current.length && results.length > 0) {
      const hasNewResults = results.some((result, i) => 
        previousResultsRef.current[i]?.winner?.id !== result.winner?.id ||
        previousResultsRef.current[i]?.loser?.id !== result.loser?.id
      );
      
      if (!hasNewResults) {
        console.log(`[EFFECT LoopCheck - generateRankings #${currentCount}] SKIPPED - Results unchanged`);
        return previousRankingsRef.current;
      }
    }
    
    // Update the previous results reference
    previousResultsRef.current = [...results];

    // This call updates activeSuggestionsRef.current internally in useRankingSuggestions
    const currentActiveSuggestions = loadSavedSuggestions();

    // Perform the ranking generation synchronously
    const countMap = new Map<number, number>();

    results.forEach(result => {
      if (result && result.winner && result.loser) {
        countMap.set(result.winner.id, (countMap.get(result.winner.id) || 0) + 1);
        countMap.set(result.loser.id, (countMap.get(result.loser.id) || 0) + 1);
      }
    });

    const participatingPokemonIds = new Set([...countMap.keys()]);

    const allRankedPokemon: RankedPokemon[] = (allPokemon || [])
      .filter(p => participatingPokemonIds.has(p.id))
      .map(p => {
        if (!p.rating) p.rating = new Rating();
        else if (!(p.rating instanceof Rating)) p.rating = new Rating(p.rating.mu, p.rating.sigma);

        const conservativeEstimate = p.rating.mu - 3 * p.rating.sigma;
        const normalizedConfidence = Math.max(0, Math.min(100, 100 * (1 - (p.rating.sigma / 8.33))));

        const pokemonFrozenStatus = frozenPokemon[p.id] || {};
        const suggestedAdjustment = currentActiveSuggestions.get(p.id);

        // CRITICAL FIX: Ensure type information is preserved
        return {
          ...p,
          // Preserve the types array structure from the original Pokemon data
          types: p.types || [], // Ensure types is always an array
          score: conservativeEstimate,
          count: countMap.get(p.id) || 0,
          confidence: normalizedConfidence,
          isFrozenForTier: pokemonFrozenStatus,
          suggestedAdjustment
        };
      })
      .sort((a, b) => b.score - a.score);

    const filteredRankings = activeTier === "All" 
      ? allRankedPokemon 
      : allRankedPokemon.slice(0, Number(activeTier));
    
    const finalWithSuggestions = filteredRankings.map(pokemon => {
      return {
        ...pokemon,
        // CRITICAL FIX: Ensure types are preserved in final mapping
        types: pokemon.types || [],
        suggestedAdjustment: currentActiveSuggestions.get(pokemon.id) || null
      };
    });

    // CRITICAL: Always set finalRankings to an array, never undefined
    const safeFinalRankings = finalWithSuggestions || [];
    setFinalRankings(safeFinalRankings);
    console.log(`🎯 Rankings generated with suggestions: ${safeFinalRankings.length} Pokémon`);

    // Debug: Verify type information is preserved
    if (safeFinalRankings.length > 0) {
      const firstPokemon = safeFinalRankings[0];
      console.log(`[DEBUG Type Preservation] First Pokemon: ${firstPokemon.name}, Types:`, firstPokemon.types);
    }

    const confidenceMap: Record<number, number> = {};
    allRankedPokemon.forEach(p => {
      confidenceMap[p.id] = p.confidence;
    });
    setConfidenceScores(confidenceMap);

    console.log(`[EFFECT LoopCheck - generateRankings #${currentCount}] COMPLETE - Returning finalWithSuggestions array, length:`, 
                 finalWithSuggestions.length);
    
    return safeFinalRankings;
  }, [allPokemon.length, activeTier, frozenPokemon, loadSavedSuggestions, setFinalRankings, setConfidenceScores]); // Optimized dependencies

  const freezePokemonForTier = useCallback((pokemonId: number, tier: TopNOption) => {
    setFrozenPokemon(prev => ({
      ...prev,
      [pokemonId]: {
        ...(prev[pokemonId] || {}),
        [tier.toString()]: true
      }
    }));
  }, []);

  const isPokemonFrozenForTier = useCallback((pokemonId: number, tier: TopNOption): boolean => {
    return Boolean(frozenPokemon[pokemonId]?.[tier.toString()]);
  }, [frozenPokemon]);

  const handleSaveRankings = useCallback(() => {
    localStorage.setItem("pokemon-frozen-pokemon", JSON.stringify(frozenPokemon));
  }, [frozenPokemon]);

  // Log out finalRankings before returning
  console.log("[DEBUG useRankings] RETURN - finalRankings is array:", 
              Array.isArray(finalRankings), 
              "length:", finalRankings?.length || 0);

  return {
    finalRankings,
    confidenceScores,
    generateRankings,
    handleSaveRankings,
    activeTier,
    setActiveTier,
    freezePokemonForTier,
    isPokemonFrozenForTier,
    allRankedPokemon: finalRankings,
    suggestRanking,
    removeSuggestion,
    markSuggestionUsed,
    clearAllSuggestions,
    findNextSuggestion,
    loadSavedSuggestions
  };
};
