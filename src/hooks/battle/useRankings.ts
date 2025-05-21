import { useState, useEffect } from "react";
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

  // Initialize the ranking suggestions hook
  const {
    suggestRanking, 
    removeSuggestion, 
    markSuggestionUsed, 
    clearAllSuggestions,
    findNextSuggestion,
    activeSuggestions
  } = useRankingSuggestions(finalRankings, setFinalRankings);

  useEffect(() => {
    // Load frozen pokemon state from localStorage
    const storedFrozen = localStorage.getItem("pokemon-frozen-pokemon");
    if (storedFrozen) {
      try {
        setFrozenPokemon(JSON.parse(storedFrozen));
      } catch (e) {
        console.error("Error loading frozen pokemon state:", e);
      }
    }
  }, []);

  // Save active tier to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("pokemon-active-tier", activeTier.toString());
  }, [activeTier]);

  // Save frozen pokemon state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("pokemon-frozen-pokemon", JSON.stringify(frozenPokemon));
  }, [frozenPokemon]);

  // Generate rankings based on TrueSkill ratings and the current tier setting
  const generateRankings = (results: SingleBattle[]): RankedPokemon[] => {
    // Create a map to track battle counts
    const countMap = new Map<number, number>();
    
    // Count battles for each Pokémon
    results.forEach(result => {
      countMap.set(result.winner.id, (countMap.get(result.winner.id) || 0) + 1);
      countMap.set(result.loser.id, (countMap.get(result.loser.id) || 0) + 1);
    });

    // Get a set of all Pokémon IDs that participated in battles
    const participatingPokemonIds = new Set([...countMap.keys()]);

    // Create ranked list with TrueSkill scores
    const allRankedPokemon: RankedPokemon[] = allPokemon
      .filter(p => participatingPokemonIds.has(p.id))
      .map(p => {
        // Create or access the rating
        if (!p.rating) {
          p.rating = new Rating(); // Default μ=25, σ≈8.33
        } else if (!(p.rating instanceof Rating)) {
          // Convert from stored format if needed
          p.rating = new Rating(p.rating.mu, p.rating.sigma);
        }

        // Calculate conservative TrueSkill estimate (μ - 3σ)
        const conservativeEstimate = p.rating.mu - 3 * p.rating.sigma;
        
        // Convert uncertainty (σ) to a confidence percentage (0-100)
        // Lower sigma means higher confidence
        const normalizedConfidence = Math.max(0, Math.min(100, 100 * (1 - (p.rating.sigma / 8.33))));

        // Get current frozen status for this Pokemon (or initialize if not exists)
        const pokemonFrozenStatus = frozenPokemon[p.id] || {};

        // Preserve existing suggestedAdjustment if it exists
        const existingRankedPokemon = finalRankings.find(rp => rp.id === p.id);
        
        // Either keep the existing suggestion or check if there's a new one in activeSuggestions
        let suggestedAdjustment = existingRankedPokemon?.suggestedAdjustment;
        
        // If there's no existing suggestion but we have one in the suggestions map, use that
        if (!suggestedAdjustment && activeSuggestions && activeSuggestions.has(p.id)) {
          suggestedAdjustment = activeSuggestions.get(p.id);
        }

        return {
          ...p,
          score: conservativeEstimate,
          count: countMap.get(p.id) || 0,
          confidence: normalizedConfidence,
          isFrozenForTier: pokemonFrozenStatus,
          suggestedAdjustment
        };
      })
      // Sort by the conservative TrueSkill estimate (higher is better)
      .sort((a, b) => b.score - a.score);

    // Filter by active tier
    const filteredRankings = activeTier === "All" 
      ? allRankedPokemon 
      : allRankedPokemon.slice(0, Number(activeTier));

    setFinalRankings(filteredRankings);

    // Create confidence map for easy lookup
    const confidenceMap: Record<number, number> = {};
    allRankedPokemon.forEach(p => {
      confidenceMap[p.id] = p.confidence;
    });
    setConfidenceScores(confidenceMap);

    return filteredRankings;
  };

  // Mark a pokemon as frozen for the current tier
  const freezePokemonForTier = (pokemonId: number, tier: TopNOption) => {
    setFrozenPokemon(prev => {
      const pokemonFrozenState = prev[pokemonId] || {};
      return {
        ...prev,
        [pokemonId]: {
          ...pokemonFrozenState,
          [tier.toString()]: true
        }
      };
    });
  };

  // Check if a pokemon is frozen for the current tier
  const isPokemonFrozenForTier = (pokemonId: number, tier: TopNOption): boolean => {
    return Boolean(frozenPokemon[pokemonId]?.[tier.toString()]);
  };

  const handleSaveRankings = () => {
    console.log("[useRankings] Rankings saved.", finalRankings);
    // Save frozen state as well
    localStorage.setItem("pokemon-frozen-pokemon", JSON.stringify(frozenPokemon));
    // We no longer clear suggestions when saving rankings
    // This allows the suggestions to persist between milestones
  };

  return {
    finalRankings,
    confidenceScores,
    generateRankings,
    handleSaveRankings,
    activeTier,
    setActiveTier,
    freezePokemonForTier,
    isPokemonFrozenForTier,
    allRankedPokemon: finalRankings, // This will be useful for battle selection
    // Ranking suggestion functions
    suggestRanking,
    removeSuggestion,
    markSuggestionUsed,
    clearAllSuggestions,
    findNextSuggestion
  };
};
