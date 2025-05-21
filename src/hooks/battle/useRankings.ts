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
  
  // Store previous rankings to ensure we don't lose suggestions
  const previousRankingsRef = useRef<RankedPokemon[]>([]);
  
  // Keep a reference to the currently active suggestions for debugging
  const activeRankingSuggestionsRef = useRef<Map<number, any>>(new Map());

  // Initialize the ranking suggestions hook
  const {
    suggestRanking, 
    removeSuggestion, 
    markSuggestionUsed, 
    clearAllSuggestions,
    findNextSuggestion,
    activeSuggestions,
    loadSavedSuggestions // Make sure this is exported from useRankingSuggestions
  } = useRankingSuggestions(finalRankings, setFinalRankings);
  
  // Set ref when activeSuggestions changes
  useEffect(() => {
    if (activeSuggestions) {
      activeRankingSuggestionsRef.current = activeSuggestions;
      
      // Debug log the active suggestions
      console.log(`🔄 useRankings: Received ${activeSuggestions.size} active suggestions from hook`);
    }
  }, [activeSuggestions]);

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

  // Update previous rankings ref when finalRankings changes
  useEffect(() => {
    if (finalRankings.length > 0) {
      previousRankingsRef.current = finalRankings;
      console.log(`📌 useRankings: Updated previousRankingsRef with ${finalRankings.length} Pokémon`);
    }
  }, [finalRankings]);

  // Force reload suggestions when rankings are empty but we have stored suggestions
  const forceReloadSuggestions = useCallback(() => {
    if (finalRankings.length === 0 && loadSavedSuggestions) {
      console.log("📣 useRankings: Forcing reload of saved suggestions");
      const loaded = loadSavedSuggestions();
      console.log(`📣 useRankings: Loaded ${loaded.size} suggestions from localStorage`);
    }
  }, [finalRankings.length, loadSavedSuggestions]);
  
  // Call once on component mount
  useEffect(() => {
    forceReloadSuggestions();
  }, [forceReloadSuggestions]);

  // Generate rankings based on TrueSkill ratings and the current tier setting
  const generateRankings = (results: SingleBattle[]): RankedPokemon[] => {
    console.log(`👉 generateRankings: Starting with ${finalRankings.length} existing rankings`);
    
    // Track all existing suggestions from previous rankings to ensure they're preserved
    const existingSuggestionsMap = new Map<number, any>();
    
    // First gather suggestions from the current finalRankings
    finalRankings.forEach(pokemon => {
      if (pokemon.suggestedAdjustment) {
        existingSuggestionsMap.set(pokemon.id, pokemon.suggestedAdjustment);
        console.log(`📝 Preserving suggestion from finalRankings for ${pokemon.name}: ${pokemon.suggestedAdjustment.direction} x${pokemon.suggestedAdjustment.strength}`);
      }
    });
    
    // Next check previousRankingsRef for any missed suggestions
    previousRankingsRef.current.forEach(pokemon => {
      if (pokemon.suggestedAdjustment && !existingSuggestionsMap.has(pokemon.id)) {
        existingSuggestionsMap.set(pokemon.id, pokemon.suggestedAdjustment);
        console.log(`🔍 Found additional suggestion in previousRankingsRef for ${pokemon.name}`);
      }
    });
    
    // Finally check activeRankingSuggestionsRef from the hook
    if (activeRankingSuggestionsRef.current) {
      activeRankingSuggestionsRef.current.forEach((suggestion, pokemonId) => {
        if (!existingSuggestionsMap.has(pokemonId)) {
          const pokemon = allPokemon.find(p => p.id === pokemonId);
          existingSuggestionsMap.set(pokemonId, suggestion);
          console.log(`🔍 Found suggestion in activeSuggestions map for ${pokemon?.name || pokemonId}`);
        }
      });
    }
    
    console.log(`📊 generateRankings: Found ${existingSuggestionsMap.size} total suggestions to preserve`);
    
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

        // IMPORTANT: Get suggestion from our comprehensive map
        const suggestedAdjustment = existingSuggestionsMap.get(p.id);
        
        // Log if we're preserving a suggestion
        if (suggestedAdjustment) {
          console.log(`🔹 Preserving suggestion for ${p.name}: ${suggestedAdjustment.direction} x${suggestedAdjustment.strength} (used: ${suggestedAdjustment.used})`);
        }

        return {
          ...p,
          score: conservativeEstimate,
          count: countMap.get(p.id) || 0,
          confidence: normalizedConfidence,
          isFrozenForTier: pokemonFrozenStatus,
          suggestedAdjustment // Assign from our preserved suggestions map
        };
      })
      // Sort by the conservative TrueSkill estimate (higher is better)
      .sort((a, b) => b.score - a.score);

    // Count suggestions in the new rankings
    const newSuggestionCount = allRankedPokemon.filter(p => p.suggestedAdjustment).length;
    console.log(`🔄 generateRankings: Preserved ${newSuggestionCount} suggestions in new rankings`);

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
    // We do NOT clear suggestions when saving rankings
    
    // Log existing suggestions count when saving
    const suggestionCount = finalRankings.filter(p => p.suggestedAdjustment).length;
    const unusedCount = finalRankings.filter(p => 
      p.suggestedAdjustment && !p.suggestedAdjustment.used
    ).length;
    console.log(`💾 handleSaveRankings: Saving with ${suggestionCount} suggestions (${unusedCount} unused)`);
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
    allRankedPokemon: finalRankings, 
    // Ranking suggestion functions
    suggestRanking,
    removeSuggestion,
    markSuggestionUsed,
    clearAllSuggestions,
    findNextSuggestion
  };
};
