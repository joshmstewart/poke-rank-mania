
import { useCallback, useRef } from "react";
import { RankedPokemon, TopNOption } from "@/services/pokemon";
import { SingleBattle } from "./types";
import { Rating } from "ts-trueskill";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { useTypeExtraction } from "./useTypeExtraction";

export const useRankingCalculator = (
  activeTier: TopNOption,
  frozenPokemon: Record<number, { [tier: string]: boolean }>,
  setFinalRankings: React.Dispatch<React.SetStateAction<RankedPokemon[]>>,
  setConfidenceScores: React.Dispatch<React.SetStateAction<Record<number, number>>>,
  loadSavedSuggestions: () => Map<number, any>
) => {
  const { pokemonLookupMap } = usePokemonContext();
  const { extractPokemonTypes } = useTypeExtraction();
  
  const previousRankingsRef = useRef<RankedPokemon[]>([]);
  const previousResultsRef = useRef<SingleBattle[]>([]);
  const rankingGenerationCountRef = useRef(0);

  const generateRankings = useCallback((results: SingleBattle[]): RankedPokemon[] => {
    console.log("[DEBUG generateRankings] Starting with results:", results.length);
    
    rankingGenerationCountRef.current++;
    const currentCount = rankingGenerationCountRef.current;
    
    // Check if results haven't changed substantially
    if (results.length === previousResultsRef.current.length && results.length > 0) {
      const hasNewResults = results.some((result, i) => 
        previousResultsRef.current[i]?.winner?.id !== result.winner?.id ||
        previousResultsRef.current[i]?.loser?.id !== result.loser?.id
      );
      
      if (!hasNewResults) {
        console.log(`[generateRankings #${currentCount}] SKIPPED - Results unchanged`);
        return previousRankingsRef.current;
      }
    }
    
    previousResultsRef.current = [...results];

    // Load active suggestions
    const currentActiveSuggestions = loadSavedSuggestions();

    // Build count map from battle results
    const countMap = new Map<number, number>();
    results.forEach(result => {
      if (result && result.winner && result.loser) {
        countMap.set(result.winner.id, (countMap.get(result.winner.id) || 0) + 1);
        countMap.set(result.loser.id, (countMap.get(result.loser.id) || 0) + 1);
      }
    });

    const participatingPokemonIds = new Set([...countMap.keys()]);

    // Use context lookup map with verified data integrity
    const allRankedPokemon: RankedPokemon[] = Array.from(participatingPokemonIds)
      .map(pokemonId => {
        const completePokemon = pokemonLookupMap.get(pokemonId);
        if (!completePokemon) {
          console.warn(`[generateRankings] Pokemon ID ${pokemonId} not found in context lookup map`);
          return null;
        }

        console.log(`[generateRankings] Details for ${pokemonId} FROM LOOKUP MAP:`, JSON.stringify({
          id: completePokemon.id,
          name: completePokemon.name,
          types: completePokemon.types,
          typesIsArray: Array.isArray(completePokemon.types),
          typesLength: completePokemon.types?.length || 0
        }));

        // Ensure rating exists
        if (!completePokemon.rating) {
          completePokemon.rating = new Rating();
        } else if (!(completePokemon.rating instanceof Rating)) {
          completePokemon.rating = new Rating(completePokemon.rating.mu, completePokemon.rating.sigma);
        }

        const conservativeEstimate = completePokemon.rating.mu - 3 * completePokemon.rating.sigma;
        const normalizedConfidence = Math.max(0, Math.min(100, 100 * (1 - (completePokemon.rating.sigma / 8.33))));

        const pokemonFrozenStatus = frozenPokemon[completePokemon.id] || {};
        const suggestedAdjustment = currentActiveSuggestions.get(completePokemon.id);

        // Extract types using helper function
        const { type1, type2 } = extractPokemonTypes(completePokemon);

        const rankedPokemon: RankedPokemon = {
          ...completePokemon,
          types: completePokemon.types || [],
          type1,
          type2,
          score: conservativeEstimate,
          count: countMap.get(completePokemon.id) || 0,
          confidence: normalizedConfidence,
          isFrozenForTier: pokemonFrozenStatus,
          suggestedAdjustment
        };

        console.log(`[DEBUG generateRankings] Created RankedPokemon for ${completePokemon.name}:`, {
          type1: rankedPokemon.type1,
          type2: rankedPokemon.type2,
          hasTypes: !!rankedPokemon.types,
          typesLength: rankedPokemon.types?.length || 0
        });

        return rankedPokemon;
      })
      .filter(Boolean) as RankedPokemon[];

    // Sort by score
    allRankedPokemon.sort((a, b) => b.score - a.score);

    // Apply tier filtering
    const filteredRankings = activeTier === "All" 
      ? allRankedPokemon 
      : allRankedPokemon.slice(0, Number(activeTier));
    
    // Final processing with suggestions
    const finalWithSuggestions = filteredRankings.map(pokemon => ({
      ...pokemon,
      suggestedAdjustment: currentActiveSuggestions.get(pokemon.id) || null
    }));

    const safeFinalRankings = finalWithSuggestions || [];
    setFinalRankings(safeFinalRankings);
    console.log(`[generateRankings #${currentCount}] Generated ${safeFinalRankings.length} rankings with types preserved`);

    // Set confidence scores
    const confidenceMap: Record<number, number> = {};
    allRankedPokemon.forEach(p => {
      confidenceMap[p.id] = p.confidence;
    });
    setConfidenceScores(confidenceMap);

    console.log(`[generateRankings #${currentCount}] COMPLETE - Returning array length:`, safeFinalRankings.length);
    
    // Update previous rankings ref
    previousRankingsRef.current = safeFinalRankings;
    
    return safeFinalRankings;
  }, [pokemonLookupMap, activeTier, frozenPokemon, loadSavedSuggestions, setFinalRankings, setConfidenceScores, extractPokemonTypes]);

  return { generateRankings };
};
