
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
      console.log("[POKEMON_RANKER_CLOUD] Loading data from cloud...");
      await loadFromCloud();
    };
    
    initializeFromCloud();
  }, [loadFromCloud]);
  
  // CRITICAL FIX: Sync TrueSkill data using Pokemon context data
  useEffect(() => {
    const updateRankingsFromTrueSkill = () => {
      console.log("[TRUESKILL_MANUAL_CLOUD] Attempting to sync TrueSkill data to Manual mode");
      
      const allRatings = getAllRatings();
      const ratedPokemonIds = Object.keys(allRatings).map(Number);
      
      console.log("[TRUESKILL_MANUAL_CLOUD] Found TrueSkill ratings for Pokemon IDs:", ratedPokemonIds);
      
      if (ratedPokemonIds.length === 0) {
        console.log("[TRUESKILL_MANUAL_CLOUD] No TrueSkill ratings found");
        return;
      }
      
      // CRITICAL FIX: Get Pokemon from context lookup map instead of current state arrays
      const allAvailablePokemon = Array.from(pokemonLookupMap.values());
      
      console.log("[TRUESKILL_MANUAL_CLOUD] Working with", allAvailablePokemon.length, "total Pokemon from context");
      
      if (allAvailablePokemon.length === 0) {
        console.log("[TRUESKILL_MANUAL_CLOUD] No Pokemon in context lookup map - waiting for data");
        return;
      }
      
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
          console.log("[TRUESKILL_MANUAL_CLOUD] Added to rated:", pokemon.name, "μ=" + rating.mu.toFixed(2));
        } else {
          unratedPokemon.push(pokemon);
        }
      });
      
      // Sort rated Pokemon by conservative score (mu - 3 * sigma)
      ratedPokemon.sort((a, b) => {
        const scoreA = a.rating ? (a.rating.mu - 3 * a.rating.sigma) : 0;
        const scoreB = b.rating ? (b.rating.mu - 3 * b.rating.sigma) : 0;
        return scoreB - scoreA;
      });
      
      // Calculate confidence scores
      const newConfidenceScores: Record<number, number> = {};
      ratedPokemon.forEach(pokemon => {
        if (pokemon.rating) {
          newConfidenceScores[pokemon.id] = Math.max(0, Math.min(100, 100 * (1 - (pokemon.rating.sigma / 8.33))));
        }
      });
      
      // Update state
      setRankedPokemon(ratedPokemon);
      setAvailablePokemon(unratedPokemon);
      setConfidenceScores(newConfidenceScores);
      
      console.log("[TRUESKILL_MANUAL_CLOUD] ✅ Successfully synced Manual Mode:");
      console.log("[TRUESKILL_MANUAL_CLOUD] - Ranked Pokemon:", ratedPokemon.length);
      console.log("[TRUESKILL_MANUAL_CLOUD] - Available Pokemon:", unratedPokemon.length);
    };
    
    // CRITICAL FIX: Only check that Pokemon context data is loaded and store is ready
    if (!isLoading && !storeIsLoading && pokemonLookupMap.size > 0) {
      console.log("[TRUESKILL_MANUAL_CLOUD] ✅ Data ready - attempting sync with context data");
      
      // Small delay to ensure Pokemon data is fully loaded
      setTimeout(() => {
        updateRankingsFromTrueSkill();
      }, 100);
    } else {
      console.log("[TRUESKILL_MANUAL_CLOUD] ⏳ Waiting for data:", {
        pokemonLoading: isLoading,
        storeLoading: storeIsLoading,
        contextPokemonCount: pokemonLookupMap.size
      });
    }
  }, [isLoading, storeIsLoading, pokemonLookupMap.size, getAllRatings, getRating, setRankedPokemon, setAvailablePokemon, setConfidenceScores]);

  // Listen for TrueSkill store updates from Battle mode
  useEffect(() => {
    const handleStoreUpdate = (event: CustomEvent) => {
      console.log("[TRUESKILL_MANUAL_CLOUD] Received TrueSkill store update, re-syncing");
      
      // Small delay to ensure store is fully updated
      setTimeout(() => {
        if (!isLoading && !storeIsLoading && pokemonLookupMap.size > 0) {
          const allRatings = getAllRatings();
          const ratedPokemonIds = Object.keys(allRatings).map(Number);
          
          if (ratedPokemonIds.length === 0) return;
          
          // Use context Pokemon data for re-sync too
          const allAvailablePokemon = Array.from(pokemonLookupMap.values());
          
          if (allAvailablePokemon.length === 0) {
            console.log("[TRUESKILL_MANUAL_CLOUD] No Pokemon in context during update");
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
          
          console.log("[TRUESKILL_MANUAL_CLOUD] ✅ Re-sync completed - Ranked:", ratedPokemon.length);
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
  }, [getAllRatings, getRating, isLoading, storeIsLoading, pokemonLookupMap.size, setRankedPokemon, setAvailablePokemon, setConfidenceScores]);

  return {
    isStoreLoading: storeIsLoading
  };
};
