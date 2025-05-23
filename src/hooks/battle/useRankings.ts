import { useState, useEffect, useRef, useCallback } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { SingleBattle } from "./types";
import { Rating } from "ts-trueskill";
import { useRankingSuggestions } from "./useRankingSuggestions";

export const useRankings = (allPokemon: Pokemon[]) => {
  const [finalRankings, setFinalRankings] = useState<RankedPokemon[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<Record<number, number>>({});
  const [activeTier, setActiveTier] = useState<TopNOption>(() => {
    const storedTier = localStorage.getItem("pokemon-active-tier");
    return storedTier ? (storedTier === "All" ? "All" : Number(storedTier) as TopNOption) : 25;
  });
  const [frozenPokemon, setFrozenPokemon] = useState<Record<number, { [tier: string]: boolean }>>({});

  // Keep track of the previous results to prevent unnecessary regeneration
  const previousRankingsRef = useRef<RankedPokemon[]>([]);
  const previousResultsRef = useRef<SingleBattle[]>([]);

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

  // IMPROVED: Check for substantial changes before regenerating rankings
  const generateRankings = useCallback((results: SingleBattle[]) => {
    console.log("[EFFECT LoopCheck - generateRankings] ENTRY - Results count:", results.length);

    // Check if results haven't changed substantially - avoid unnecessary regeneration
    if (results.length === previousResultsRef.current.length && results.length > 0) {
      const hasNewResults = results.some((result, i) => 
        previousResultsRef.current[i]?.winner?.id !== result.winner?.id ||
        previousResultsRef.current[i]?.loser?.id !== result.loser?.id
      );
      
      if (!hasNewResults) {
        console.log("[EFFECT LoopCheck - generateRankings] SKIPPED - Results unchanged");
        return previousRankingsRef.current;
      }
    }
    
    // Update the previous results reference
    previousResultsRef.current = results;

    const countMap = new Map<number, number>();

    results.forEach(result => {
      countMap.set(result.winner.id, (countMap.get(result.winner.id) || 0) + 1);
      countMap.set(result.loser.id, (countMap.get(result.loser.id) || 0) + 1);
    });

    const participatingPokemonIds = new Set([...countMap.keys()]);

    const allRankedPokemon: RankedPokemon[] = allPokemon
      .filter(p => participatingPokemonIds.has(p.id))
      .map(p => {
        if (!p.rating) p.rating = new Rating();
        else if (!(p.rating instanceof Rating)) p.rating = new Rating(p.rating.mu, p.rating.sigma);

        const conservativeEstimate = p.rating.mu - 3 * p.rating.sigma;
        const normalizedConfidence = Math.max(0, Math.min(100, 100 * (1 - (p.rating.sigma / 8.33))));

        const pokemonFrozenStatus = frozenPokemon[p.id] || {};
        const suggestedAdjustment = activeSuggestions.get(p.id);

        return {
          ...p,
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

    // Explicitly reload suggestions here:
    const savedSuggestions = loadSavedSuggestions();
    console.log("[DEBUG useRankings - generateRankings] Applying suggestions during ranking generation:", savedSuggestions.size);
    
    if (savedSuggestions.size > 0) {
      const sampleSuggestions = [...savedSuggestions.entries()].slice(0, 3);
      console.log("[DEBUG useRankings - generateRankings SUGGESTIONS DATA]", 
        JSON.stringify(sampleSuggestions.map(([id, suggestion]) => ({ 
          id, 
          direction: suggestion.direction,
          strength: suggestion.strength,
          used: suggestion.used 
        }))));
    }

    const finalWithSuggestions = filteredRankings.map(pokemon => {
      const newPokemon = {
        ...pokemon,
        suggestedAdjustment: savedSuggestions.get(pokemon.id) || null
      };
      return newPokemon;
    });

    // Provide more informative log about suggestions
    const pokemonWithSuggestions = finalWithSuggestions.filter(p => p.suggestedAdjustment);
    
    if (pokemonWithSuggestions.length > 0) {
      console.log("[DEBUG useRankings - generateRankings FINAL] Generated rankings with suggestions. Sample from suggestions:", 
        JSON.stringify(pokemonWithSuggestions.slice(0, 3).map(p => ({ 
          id: p.id, 
          name: p.name, 
          used: p.suggestedAdjustment?.used,
          direction: p.suggestedAdjustment?.direction,
          strength: p.suggestedAdjustment?.strength
        }))));
    } else {
      console.log("[DEBUG useRankings - generateRankings FINAL] Generated rankings WITHOUT any suggestions applied.");
    }

    setFinalRankings(finalWithSuggestions);
    console.log(`🎯 Rankings generated with suggestions: ${finalWithSuggestions.length} Pokémon`);

    const confidenceMap: Record<number, number> = {};
    allRankedPokemon.forEach(p => {
      confidenceMap[p.id] = p.confidence;
    });
    setConfidenceScores(confidenceMap);

    return filteredRankings;
  }, [allPokemon, activeTier, frozenPokemon, activeSuggestions, loadSavedSuggestions]);

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
