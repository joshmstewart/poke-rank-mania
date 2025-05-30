
import { useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { Rating } from "ts-trueskill";

interface UseTrueSkillIntegrationProps {
  isLoading: boolean;
  storeLoading: boolean;
  availablePokemon: Pokemon[];
  rankedPokemon: Pokemon[];
  setRankedPokemon: (value: Pokemon[]) => void;
  setAvailablePokemon: (value: Pokemon[]) => void;
  setConfidenceScores: (value: Record<number, number>) => void;
}

export const useTrueSkillIntegration = ({
  isLoading,
  storeLoading,
  availablePokemon,
  rankedPokemon,
  setRankedPokemon,
  setAvailablePokemon,
  setConfidenceScores
}: UseTrueSkillIntegrationProps) => {
  const { getAllRatings, getRating, loadFromCloud, isLoading: storeIsLoading } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  
  // Load data from cloud on startup
  useEffect(() => {
    const initializeFromCloud = async () => {
      console.log("[TRUESKILL_DEBUG] Loading data from cloud...");
      await loadFromCloud();
      console.log("[TRUESKILL_DEBUG] Cloud load completed");
    };
    
    initializeFromCloud();
  }, [loadFromCloud]);
  
  // MAIN SYNC EFFECT - works for both Battle and Manual mode
  useEffect(() => {
    const updateRankingsFromTrueSkill = () => {
      console.log("[TRUESKILL_DEBUG] ===== STARTING SYNC ATTEMPT =====");
      console.log("[TRUESKILL_DEBUG] Current state check:");
      console.log("[TRUESKILL_DEBUG] - isLoading:", isLoading);
      console.log("[TRUESKILL_DEBUG] - storeIsLoading:", storeIsLoading);
      console.log("[TRUESKILL_DEBUG] - pokemonLookupMap.size:", pokemonLookupMap.size);
      console.log("[TRUESKILL_DEBUG] - availablePokemon.length:", availablePokemon.length);
      console.log("[TRUESKILL_DEBUG] - rankedPokemon.length:", rankedPokemon.length);
      
      const allRatings = getAllRatings();
      const ratedPokemonIds = Object.keys(allRatings).map(Number);
      
      console.log("[TRUESKILL_DEBUG] TrueSkill store analysis:");
      console.log("[TRUESKILL_DEBUG] - Total ratings in store:", Object.keys(allRatings).length);
      console.log("[TRUESKILL_DEBUG] - Rated Pokemon IDs:", ratedPokemonIds.slice(0, 10));
      
      if (ratedPokemonIds.length === 0) {
        console.log("[TRUESKILL_DEBUG] ❌ No TrueSkill ratings found - cannot sync");
        return;
      }
      
      // Get Pokemon data - prioritize context map but use Manual mode arrays as fallback
      let allAvailablePokemon: Pokemon[] = [];
      
      if (pokemonLookupMap.size > 0) {
        // Battle mode or context available: use lookup map
        console.log("[TRUESKILL_DEBUG] Using Pokemon context lookup map");
        allAvailablePokemon = Array.from(pokemonLookupMap.values());
      } else if (availablePokemon.length > 0 || rankedPokemon.length > 0) {
        // Manual mode: combine current arrays to get all Pokemon
        console.log("[TRUESKILL_DEBUG] Using current Pokemon arrays (Manual mode)");
        const combinedPokemon = [...availablePokemon, ...rankedPokemon];
        
        // Remove duplicates by ID
        const pokemonMap = new Map<number, Pokemon>();
        combinedPokemon.forEach(pokemon => {
          pokemonMap.set(pokemon.id, pokemon);
        });
        allAvailablePokemon = Array.from(pokemonMap.values());
        
        console.log("[TRUESKILL_DEBUG] Combined Pokemon from current arrays:");
        console.log("[TRUESKILL_DEBUG] - Available:", availablePokemon.length);
        console.log("[TRUESKILL_DEBUG] - Ranked:", rankedPokemon.length);
        console.log("[TRUESKILL_DEBUG] - Combined unique:", allAvailablePokemon.length);
      } else {
        console.log("[TRUESKILL_DEBUG] ❌ No Pokemon data available from any source");
        return;
      }
      
      if (allAvailablePokemon.length === 0) {
        console.log("[TRUESKILL_DEBUG] ❌ No Pokemon available for processing");
        return;
      }
      
      // Check if any of the available Pokemon have ratings
      const availablePokemonIds = allAvailablePokemon.map(p => p.id);
      const matchingIds = ratedPokemonIds.filter(id => availablePokemonIds.includes(id));
      console.log("[TRUESKILL_DEBUG] - Available Pokemon IDs (first 10):", availablePokemonIds.slice(0, 10));
      console.log("[TRUESKILL_DEBUG] - Rated Pokemon IDs (first 10):", ratedPokemonIds.slice(0, 10));
      console.log("[TRUESKILL_DEBUG] - Matching IDs:", matchingIds.length);
      
      // Separate Pokemon into rated and unrated
      const ratedPokemon: Pokemon[] = [];
      const unratedPokemon: Pokemon[] = [];
      
      allAvailablePokemon.forEach(pokemon => {
        if (ratedPokemonIds.includes(pokemon.id)) {
          const rating = getRating(pokemon.id);
          const pokemonWithRating = {
            ...pokemon,
            rating: rating
          };
          ratedPokemon.push(pokemonWithRating);
          console.log("[TRUESKILL_DEBUG] ✅ Added to rated:", pokemon.name, `μ=${rating.mu.toFixed(2)}, σ=${rating.sigma.toFixed(2)}`);
        } else {
          unratedPokemon.push(pokemon);
        }
      });
      
      console.log("[TRUESKILL_DEBUG] Separation results:");
      console.log("[TRUESKILL_DEBUG] - Rated Pokemon count:", ratedPokemon.length);
      console.log("[TRUESKILL_DEBUG] - Unrated Pokemon count:", unratedPokemon.length);
      
      if (ratedPokemon.length === 0) {
        console.log("[TRUESKILL_DEBUG] ❌ No Pokemon matched between TrueSkill store and available Pokemon");
        return;
      }
      
      // Sort rated Pokemon by conservative score (mu - 3 * sigma)
      ratedPokemon.sort((a, b) => {
        const scoreA = a.rating ? (a.rating.mu - 3 * a.rating.sigma) : 0;
        const scoreB = b.rating ? (b.rating.mu - 3 * b.rating.sigma) : 0;
        return scoreB - scoreA;
      });
      
      console.log("[TRUESKILL_DEBUG] Top 5 rated Pokemon after sorting:");
      ratedPokemon.slice(0, 5).forEach((pokemon, index) => {
        if (pokemon.rating) {
          const score = pokemon.rating.mu - 3 * pokemon.rating.sigma;
          console.log(`[TRUESKILL_DEBUG] ${index + 1}. ${pokemon.name}: μ=${pokemon.rating.mu.toFixed(2)}, σ=${pokemon.rating.sigma.toFixed(2)}, score=${score.toFixed(2)}`);
        }
      });
      
      // Calculate confidence scores
      const newConfidenceScores: Record<number, number> = {};
      ratedPokemon.forEach(pokemon => {
        if (pokemon.rating) {
          newConfidenceScores[pokemon.id] = Math.max(0, Math.min(100, 100 * (1 - (pokemon.rating.sigma / 8.33))));
        }
      });
      
      console.log("[TRUESKILL_DEBUG] ===== UPDATING STATE =====");
      console.log("[TRUESKILL_DEBUG] About to set:");
      console.log("[TRUESKILL_DEBUG] - Ranked Pokemon:", ratedPokemon.length);
      console.log("[TRUESKILL_DEBUG] - Available Pokemon:", unratedPokemon.length);
      console.log("[TRUESKILL_DEBUG] - Confidence scores:", Object.keys(newConfidenceScores).length);
      
      // Update state
      setRankedPokemon(ratedPokemon);
      setAvailablePokemon(unratedPokemon);
      setConfidenceScores(newConfidenceScores);
      
      console.log("[TRUESKILL_DEBUG] ✅ ===== SYNC COMPLETED SUCCESSFULLY =====");
    };
    
    // FIXED: Updated readiness check - Manual mode is ready when it has Pokemon data
    const hasManualModePokemon = availablePokemon.length > 0 || rankedPokemon.length > 0;
    const hasBattleModePokemon = pokemonLookupMap.size > 0;
    const hasPokemonData = hasManualModePokemon || hasBattleModePokemon;
    const isReady = !isLoading && !storeIsLoading && hasPokemonData;
    
    console.log("[TRUESKILL_DEBUG] ===== SYNC READINESS CHECK =====");
    console.log("[TRUESKILL_DEBUG] isReady:", isReady);
    console.log("[TRUESKILL_DEBUG] Breakdown:");
    console.log("[TRUESKILL_DEBUG] - !isLoading:", !isLoading);
    console.log("[TRUESKILL_DEBUG] - !storeIsLoading:", !storeIsLoading);
    console.log("[TRUESKILL_DEBUG] - hasPokemonData:", hasPokemonData);
    console.log("[TRUESKILL_DEBUG]   - hasManualModePokemon:", hasManualModePokemon);
    console.log("[TRUESKILL_DEBUG]   - hasBattleModePokemon:", hasBattleModePokemon);
    
    if (isReady) {
      console.log("[TRUESKILL_DEBUG] ✅ Data ready - attempting sync");
      
      // Check store state right before sync
      const preSync = getAllRatings();
      console.log(`🔍 [PRE_SYNC_CHECK] Store has ${Object.keys(preSync).length} ratings before sync`);
      
      if (Object.keys(preSync).length > 0) {
        updateRankingsFromTrueSkill();
      } else {
        console.log("[TRUESKILL_DEBUG] ⏳ Store has no ratings yet, waiting...");
      }
    } else {
      console.log("[TRUESKILL_DEBUG] ⏳ Waiting for data to be ready");
    }
  }, [isLoading, storeIsLoading, pokemonLookupMap.size, availablePokemon.length, rankedPokemon.length, getAllRatings, getRating, setRankedPokemon, setAvailablePokemon, setConfidenceScores]);

  // Listen for TrueSkill store updates from Battle mode
  useEffect(() => {
    const handleStoreUpdate = (event: CustomEvent) => {
      console.log("[TRUESKILL_DEBUG] ===== STORE UPDATE EVENT RECEIVED =====");
      console.log("[TRUESKILL_DEBUG] Event type:", event.type);
      console.log("[TRUESKILL_DEBUG] Event detail:", event.detail);
      
      // Small delay to ensure store is fully updated
      setTimeout(() => {
        const hasManualModePokemon = availablePokemon.length > 0 || rankedPokemon.length > 0;
        const hasBattleModePokemon = pokemonLookupMap.size > 0;
        const hasPokemonData = hasManualModePokemon || hasBattleModePokemon;
        
        if (!isLoading && !storeIsLoading && hasPokemonData) {
          console.log("[TRUESKILL_DEBUG] Re-syncing after store update");
          
          const allRatings = getAllRatings();
          const ratedPokemonIds = Object.keys(allRatings).map(Number);
          
          console.log("[TRUESKILL_DEBUG] Store update - ratings count:", Object.keys(allRatings).length);
          
          if (ratedPokemonIds.length === 0) {
            console.log("[TRUESKILL_DEBUG] No ratings after store update");
            return;
          }
          
          // Use the same data source logic as main sync
          let allAvailablePokemon: Pokemon[] = [];
          
          if (pokemonLookupMap.size > 0) {
            allAvailablePokemon = Array.from(pokemonLookupMap.values());
          } else {
            const combinedPokemon = [...availablePokemon, ...rankedPokemon];
            const pokemonMap = new Map<number, Pokemon>();
            combinedPokemon.forEach(pokemon => {
              pokemonMap.set(pokemon.id, pokemon);
            });
            allAvailablePokemon = Array.from(pokemonMap.values());
          }
          
          if (allAvailablePokemon.length === 0) {
            console.log("[TRUESKILL_DEBUG] No Pokemon data during update");
            return;
          }
          
          const ratedPokemon: Pokemon[] = [];
          const unratedPokemon: Pokemon[] = [];
          
          allAvailablePokemon.forEach(pokemon => {
            if (ratedPokemonIds.includes(pokemon.id)) {
              const rating = getRating(pokemon.id);
              ratedPokemon.push({ ...pokemon, rating });
            } else {
              unratedPokemon.push(pokemon);
            }
          });
          
          ratedPokemon.sort((a, b) => {
            const scoreA = a.rating ? (a.rating.mu - 3 * a.rating.sigma) : 0;
            const scoreB = b.rating ? (b.rating.mu - 3 * b.rating.sigma) : 0;
            return scoreB - scoreA;
          });
          
          const newConfidenceScores: Record<number, number> = {};
          ratedPokemon.forEach(pokemon => {
            if (pokemon.rating) {
              newConfidenceScores[pokemon.id] = Math.max(0, Math.min(100, 100 * (1 - (pokemon.rating.sigma / 8.33))));
            }
          });
          
          setRankedPokemon(ratedPokemon);
          setAvailablePokemon(unratedPokemon);
          setConfidenceScores(newConfidenceScores);
          
          console.log("[TRUESKILL_DEBUG] ✅ Re-sync completed - Ranked:", ratedPokemon.length);
        } else {
          console.log("[TRUESKILL_DEBUG] Not ready for re-sync after store update");
        }
      }, 100);
    };
    
    // Listen for store updates
    document.addEventListener('trueskill-store-updated', handleStoreUpdate as EventListener);
    document.addEventListener('trueskill-store-loaded', handleStoreUpdate as EventListener);

    return () => {
      document.removeEventListener('trueskill-store-updated', handleStoreUpdate as EventListener);
      document.removeEventListener('trueskill-store-loaded', handleStoreUpdate as EventListener);
    };
  }, [getAllRatings, getRating, isLoading, storeIsLoading, pokemonLookupMap.size, availablePokemon.length, rankedPokemon.length, setRankedPokemon, setAvailablePokemon, setConfidenceScores]);

  return {
    isStoreLoading: storeIsLoading
  };
};
