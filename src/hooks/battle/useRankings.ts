import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { SingleBattle } from "./types";
import { Rating } from "ts-trueskill";
import { useRankingSuggestions } from "./useRankingSuggestions";

// Type definitions for Pokemon type structure
interface PokemonTypeInfo {
  name: string;
  url?: string;
}

interface PokemonTypeSlot {
  slot: number;
  type: PokemonTypeInfo;
}

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

  // CRITICAL FIX: Create a stable lookup map for Pokemon data to preserve types
  const pokemonLookupMap = useMemo(() => {
    const map = new Map<number, Pokemon>();
    allPokemon.forEach(pokemon => {
      // Ensure we preserve the complete Pokemon object including types
      map.set(pokemon.id, {
        ...pokemon,
        types: pokemon.types || [] // Ensure types array exists
      });
    });
    console.log(`[DEBUG useRankings] Created Pokemon lookup map with ${map.size} entries`);
    return map;
  }, [allPokemon]);

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

  // Helper function to safely extract type names from Pokemon data
  const extractPokemonTypes = useCallback((pokemon: Pokemon): string[] => {
    console.log(`[DEBUG Type Extraction] Pokemon ${pokemon.name} (${pokemon.id}) raw types:`, pokemon.types);
    
    if (!pokemon.types || !Array.isArray(pokemon.types) || pokemon.types.length === 0) {
      console.log(`[DEBUG Type Extraction] No valid types found for ${pokemon.name}`);
      return ['unknown'];
    }

    const extractedTypes: string[] = [];

    for (let i = 0; i < pokemon.types.length; i++) {
      const typeSlot = pokemon.types[i];
      
      // Early continue for null/undefined values
      if (!typeSlot) {
        continue;
      }

      // Handle string types directly
      if (typeof typeSlot === 'string') {
        extractedTypes.push(typeSlot);
        continue;
      }

      // Handle object types with explicit type assertions
      if (typeof typeSlot === 'object') {
        // Handle nested type structure: { slot: 1, type: { name: 'grass' } }
        const slotAsAny = typeSlot as any;
        if (slotAsAny && slotAsAny.type && typeof slotAsAny.type === 'object' && typeof slotAsAny.type.name === 'string') {
          extractedTypes.push(slotAsAny.type.name);
          continue;
        }

        // Handle direct name structure: { name: 'grass' }
        if (slotAsAny && typeof slotAsAny.name === 'string') {
          extractedTypes.push(slotAsAny.name);
          continue;
        }
      }
    }

    const finalTypes = extractedTypes.length > 0 ? extractedTypes : ['unknown'];
    console.log(`[DEBUG Type Extraction] Final types for ${pokemon.name}:`, finalTypes);
    return finalTypes;
  }, []);

  // CRITICAL TYPE PRESERVATION FIX: Enhanced ranking generation with proper Pokemon lookup
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

    // CRITICAL FIX: Use the lookup map to get complete Pokemon data with preserved types
    const allRankedPokemon: RankedPokemon[] = Array.from(participatingPokemonIds)
      .map(pokemonId => {
        // Get the complete Pokemon data from our lookup map
        const completePokemon = pokemonLookupMap.get(pokemonId);
        if (!completePokemon) {
          console.warn(`[DEBUG useRankings] Pokemon ID ${pokemonId} not found in lookup map`);
          return null;
        }

        // Ensure rating exists
        if (!completePokemon.rating) completePokemon.rating = new Rating();
        else if (!(completePokemon.rating instanceof Rating)) completePokemon.rating = new Rating(completePokemon.rating.mu, completePokemon.rating.sigma);

        const conservativeEstimate = completePokemon.rating.mu - 3 * completePokemon.rating.sigma;
        const normalizedConfidence = Math.max(0, Math.min(100, 100 * (1 - (completePokemon.rating.sigma / 8.33))));

        const pokemonFrozenStatus = frozenPokemon[completePokemon.id] || {};
        const suggestedAdjustment = currentActiveSuggestions.get(completePokemon.id);

        // CRITICAL TYPE PRESERVATION: Use the complete Pokemon data which preserves types
        const pokemonTypes = extractPokemonTypes(completePokemon);

        console.log(`[DEBUG Type Preservation] ${completePokemon.name} (${completePokemon.id}) - Original types:`, completePokemon.types, "Extracted:", pokemonTypes);

        return {
          ...completePokemon,
          // CRITICAL: Preserve the correctly processed types array
          types: pokemonTypes,
          score: conservativeEstimate,
          count: countMap.get(completePokemon.id) || 0,
          confidence: normalizedConfidence,
          isFrozenForTier: pokemonFrozenStatus,
          suggestedAdjustment
        };
      })
      .filter(Boolean) as RankedPokemon[]
      .sort((a, b) => b.score - a.score);

    const filteredRankings = activeTier === "All" 
      ? allRankedPokemon 
      : allRankedPokemon.slice(0, Number(activeTier));
    
    const finalWithSuggestions = filteredRankings.map(pokemon => {
      // CRITICAL TYPE PRESERVATION: Ensure types are maintained in final output
      const preservedTypes = pokemon.types || ['unknown'];
      console.log(`[DEBUG Type Verification] ${pokemon.name} (ID: ${pokemon.id}) - Types:`, 
        Array.isArray(preservedTypes) ? preservedTypes : 'not array', 
        preservedTypes?.length || 0, 'entries');
      
      return {
        ...pokemon,
        // CRITICAL: Ensure types are always properly preserved
        types: Array.isArray(preservedTypes) ? preservedTypes : ['unknown'],
        suggestedAdjustment: currentActiveSuggestions.get(pokemon.id) || null
      };
    });

    // CRITICAL: Always set finalRankings to an array, never undefined
    const safeFinalRankings = finalWithSuggestions || [];
    setFinalRankings(safeFinalRankings);
    console.log(`🎯 Rankings generated with suggestions: ${safeFinalRankings.length} Pokémon`);

    const confidenceMap: Record<number, number> = {};
    allRankedPokemon.forEach(p => {
      confidenceMap[p.id] = p.confidence;
    });
    setConfidenceScores(confidenceMap);

    console.log(`[EFFECT LoopCheck - generateRankings #${rankingGenerationCountRef.current}] COMPLETE - Returning finalWithSuggestions array, length:`, 
                 finalWithSuggestions.length);
    
    return safeFinalRankings;
  }, [pokemonLookupMap, activeTier, frozenPokemon, loadSavedSuggestions, setFinalRankings, setConfidenceScores, extractPokemonTypes]);

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
