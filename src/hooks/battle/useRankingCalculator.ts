
import { useCallback, useRef } from "react";
import { RankedPokemon, TopNOption } from "@/services/pokemon";
import { SingleBattle } from "./types";
import { Rating } from "ts-trueskill";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { useTypeExtraction } from "./useTypeExtraction";
import { useTrueSkillStore } from "@/stores/trueskillStore";

export const useRankingCalculator = (
  activeTier: TopNOption,
  frozenPokemon: Record<number, { [tier: string]: boolean }>,
  setFinalRankings: React.Dispatch<React.SetStateAction<RankedPokemon[]>>,
  setConfidenceScores: React.Dispatch<React.SetStateAction<Record<number, number>>>,
  loadSavedSuggestions: () => Map<number, any>
) => {
  const { pokemonLookupMap } = usePokemonContext();
  const { extractPokemonTypes } = useTypeExtraction();
  const { getAllRatings, getRating } = useTrueSkillStore();
  
  const previousRankingsRef = useRef<RankedPokemon[]>([]);
  const previousResultsRef = useRef<SingleBattle[]>([]);
  const rankingGenerationCountRef = useRef(0);

  const generateRankings = useCallback((results: SingleBattle[]): RankedPokemon[] => {
    console.log("[DEBUG generateRankings] Starting with centralized TrueSkill store");
    
    rankingGenerationCountRef.current++;
    const currentCount = rankingGenerationCountRef.current;
    
    // Get all Pokemon with TrueSkill ratings from the centralized store
    const allRatings = getAllRatings();
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    
    console.log(`[generateRankings #${currentCount}] Found ${ratedPokemonIds.length} Pokemon with TrueSkill ratings`);
    
    if (ratedPokemonIds.length === 0) {
      console.log(`[generateRankings #${currentCount}] No Pokemon with TrueSkill ratings found`);
      setFinalRankings([]);
      setConfidenceScores({});
      return [];
    }

    // Load active suggestions
    const currentActiveSuggestions = loadSavedSuggestions();

    // Build count map from battle results for battle statistics
    const countMap = new Map<number, number>();
    const winsMap = new Map<number, number>();
    const lossesMap = new Map<number, number>();
    
    results.forEach(result => {
      if (result && result.winner && result.loser) {
        // Update total counts
        countMap.set(result.winner.id, (countMap.get(result.winner.id) || 0) + 1);
        countMap.set(result.loser.id, (countMap.get(result.loser.id) || 0) + 1);
        
        // Update wins and losses
        winsMap.set(result.winner.id, (winsMap.get(result.winner.id) || 0) + 1);
        lossesMap.set(result.loser.id, (lossesMap.get(result.loser.id) || 0) + 1);
      }
    });

    // Create ranked Pokemon using centralized TrueSkill ratings
    const allRankedPokemon: RankedPokemon[] = ratedPokemonIds
      .map(pokemonId => {
        const completePokemon = pokemonLookupMap.get(pokemonId);
        if (!completePokemon) {
          console.warn(`[generateRankings] Pokemon ID ${pokemonId} not found in context lookup map`);
          return null;
        }

        // Get TrueSkill rating from centralized store
        const trueskillRating = getRating(pokemonId);
        const trueskillData = allRatings[pokemonId];
        
        console.log(`[generateRankings] ${completePokemon.name} TrueSkill: μ=${trueskillRating.mu.toFixed(2)}, σ=${trueskillRating.sigma.toFixed(2)}, battles=${trueskillData.battleCount}`);

        // Calculate conservative score (mu - 3 * sigma)
        const conservativeEstimate = trueskillRating.mu - 3 * trueskillRating.sigma;
        const normalizedConfidence = Math.max(0, Math.min(100, 100 * (1 - (trueskillRating.sigma / 8.33))));

        const pokemonFrozenStatus = frozenPokemon[completePokemon.id] || {};
        const suggestedAdjustment = currentActiveSuggestions.get(completePokemon.id);

        // Extract types using helper function
        const { type1, type2 } = extractPokemonTypes(completePokemon);

        // Calculate wins, losses, and win rate from battle results
        const wins = winsMap.get(completePokemon.id) || 0;
        const losses = lossesMap.get(completePokemon.id) || 0;
        const totalBattles = countMap.get(completePokemon.id) || trueskillData.battleCount || 0;
        const winRate = totalBattles > 0 ? (wins / totalBattles) * 100 : 0;

        const rankedPokemon: RankedPokemon = {
          ...completePokemon,
          types: completePokemon.types || [],
          type1,
          type2,
          score: conservativeEstimate,
          count: totalBattles,
          confidence: normalizedConfidence,
          wins,
          losses,
          winRate,
          rating: trueskillRating, // Include the TrueSkill rating
          isFrozenForTier: pokemonFrozenStatus,
          suggestedAdjustment
        };

        console.log(`[DEBUG generateRankings] Created RankedPokemon for ${completePokemon.name}:`, {
          score: rankedPokemon.score.toFixed(2),
          confidence: rankedPokemon.confidence.toFixed(1),
          battles: rankedPokemon.count,
          wins: rankedPokemon.wins,
          losses: rankedPokemon.losses,
          winRate: rankedPokemon.winRate.toFixed(1)
        });

        return rankedPokemon;
      })
      .filter(Boolean) as RankedPokemon[];

    // Sort by conservative score (highest first)
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
    console.log(`[generateRankings #${currentCount}] Generated ${safeFinalRankings.length} rankings from centralized TrueSkill store`);

    // Set confidence scores
    const confidenceMap: Record<number, number> = {};
    allRankedPokemon.forEach(p => {
      confidenceMap[p.id] = p.confidence;
    });
    setConfidenceScores(confidenceMap);

    console.log(`[generateRankings #${currentCount}] COMPLETE - Rankings now unified with Manual Mode`);
    
    // Update previous rankings ref
    previousRankingsRef.current = safeFinalRankings;
    
    return safeFinalRankings;
  }, [pokemonLookupMap, activeTier, frozenPokemon, loadSavedSuggestions, setFinalRankings, setConfidenceScores, extractPokemonTypes, getAllRatings, getRating]);

  return { generateRankings };
};
