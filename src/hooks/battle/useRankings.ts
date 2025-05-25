
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { SingleBattle } from "./types";
import { Rating } from "ts-trueskill";
import { useRankingSuggestions } from "./useRankingSuggestions";
import { usePokemonContext } from "@/contexts/PokemonContext";

export const useRankings = (allPokemon: Pokemon[] = []) => {
  // CRITICAL FIX: Use Pokemon context for stable lookup with verified data integrity
  const { pokemonLookupMap } = usePokemonContext();

  // CRITICAL FIX: Only log INIT once by tracking initialization
  const initializationRef = useRef(false);
  if (!initializationRef.current) {
    console.log("[DEBUG useRankings] INIT - Using context for Pokemon data");
    initializationRef.current = true;
  }
  
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

  // CRITICAL FIX: Enhanced type extraction that preserves original type structure
  const extractPokemonTypes = useCallback((pokemon: Pokemon): { type1: string; type2: string | null } => {
    console.log(`[DEBUG Type Extraction] Pokemon ${pokemon.name} (${pokemon.id}) original types:`, JSON.stringify(pokemon.types));
    
    if (!pokemon.types || !Array.isArray(pokemon.types) || pokemon.types.length === 0) {
      console.log(`[DEBUG Type Extraction] No valid types found for ${pokemon.name} - returning default`);
      return { type1: 'unknown', type2: null };
    }

    const extractedTypes: string[] = [];

    for (let i = 0; i < pokemon.types.length; i++) {
      const typeSlot = pokemon.types[i];
      
      if (!typeSlot) continue;

      // Handle string types directly
      if (typeof typeSlot === 'string') {
        extractedTypes.push(typeSlot);
        continue;
      }

      // Handle object types with nested structure: { slot: 1, type: { name: 'grass' } }
      if (typeof typeSlot === 'object') {
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

    const type1 = extractedTypes.length > 0 ? extractedTypes[0] : 'unknown';
    const type2 = extractedTypes.length > 1 ? extractedTypes[1] : null;
    
    console.log(`[DEBUG Type Extraction] Final types for ${pokemon.name}: type1=${type1}, type2=${type2}`);
    return { type1, type2 };
  }, []);

  // CRITICAL FIX: Completely rewritten generateRankings with verified data integrity
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

    // CRITICAL FIX: Use context lookup map with verified data integrity
    const allRankedPokemon: RankedPokemon[] = Array.from(participatingPokemonIds)
      .map(pokemonId => {
        // CRITICAL: Get Pokemon from stable context lookup with verification
        const completePokemon = pokemonLookupMap.get(pokemonId);
        if (!completePokemon) {
          console.warn(`[generateRankings] Pokemon ID ${pokemonId} not found in context lookup map`);
          return null;
        }

        // CRITICAL: Log the exact data from lookup map for debugging
        console.log(`[generateRankings] Details for ${pokemonId} FROM LOOKUP MAP:`, JSON.stringify({
          id: completePokemon.id,
          name: completePokemon.name,
          types: completePokemon.types
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

        // Extract types using helper function with complete Pokemon data
        const { type1, type2 } = extractPokemonTypes(completePokemon);

        // CRITICAL: Create RankedPokemon with proper type structure for display
        const rankedPokemon: RankedPokemon = {
          ...completePokemon,
          // Preserve original types array for other consumers
          types: completePokemon.types || [],
          // Add explicit type names for styling
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

    // Set state
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

  return {
    finalRankings,
    confidenceScores,
    generateRankings,
    handleSaveRankings: useCallback(() => {
      localStorage.setItem("pokemon-frozen-pokemon", JSON.stringify(frozenPokemon));
    }, [frozenPokemon]),
    activeTier,
    setActiveTier,
    freezePokemonForTier: useCallback((pokemonId: number, tier: TopNOption) => {
      setFrozenPokemon(prev => ({
        ...prev,
        [pokemonId]: {
          ...(prev[pokemonId] || {}),
          [tier.toString()]: true
        }
      }));
    }, []),
    isPokemonFrozenForTier: useCallback((pokemonId: number, tier: TopNOption): boolean => {
      return Boolean(frozenPokemon[pokemonId]?.[tier.toString()]);
    }, [frozenPokemon]),
    allRankedPokemon: finalRankings,
    suggestRanking,
    removeSuggestion,
    markSuggestionUsed,
    clearAllSuggestions,
    findNextSuggestion,
    loadSavedSuggestions
  };
};
