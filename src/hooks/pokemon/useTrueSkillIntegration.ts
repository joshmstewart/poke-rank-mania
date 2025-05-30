
import { useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { useTrueSkillStore } from "@/stores/trueskillStore";
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
  
  // Load data from cloud on startup
  useEffect(() => {
    const initializeFromCloud = async () => {
      console.log("[POKEMON_RANKER_CLOUD] Loading data from cloud...");
      await loadFromCloud();
    };
    
    initializeFromCloud();
  }, [loadFromCloud]);
  
  // CRITICAL FIX: Wait for Pokemon data AND TrueSkill store to be ready
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
      
      // Get all Pokemon from both lists
      const allCurrentPokemon = [...availablePokemon, ...rankedPokemon];
      
      if (allCurrentPokemon.length === 0) {
        console.log("[TRUESKILL_MANUAL_CLOUD] No Pokemon data loaded yet - cannot sync TrueSkill ratings");
        return;
      }
      
      console.log("[TRUESKILL_MANUAL_CLOUD] Working with", allCurrentPokemon.length, "total Pokemon");
      
      // Separate Pokemon into rated and unrated
      const ratedPokemon: Pokemon[] = [];
      const unratedPokemon: Pokemon[] = [];
      
      allCurrentPokemon.forEach(pokemon => {
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
    
    // Only sync when all conditions are met:
    // 1. Pokemon data is loaded (!isLoading)
    // 2. TrueSkill store is loaded (!storeIsLoading) 
    // 3. We have Pokemon to work with
    if (!isLoading && !storeIsLoading && (availablePokemon.length > 0 || rankedPokemon.length > 0)) {
      console.log("[TRUESKILL_MANUAL_CLOUD] ✅ All conditions met - syncing TrueSkill to Manual");
      updateRankingsFromTrueSkill();
    } else {
      console.log("[TRUESKILL_MANUAL_CLOUD] ⏳ Waiting for conditions:", {
        pokemonLoading: isLoading,
        storeLoading: storeIsLoading,
        hasPokemon: (availablePokemon.length > 0 || rankedPokemon.length > 0),
        availableCount: availablePokemon.length,
        rankedCount: rankedPokemon.length
      });
    }
  }, [isLoading, storeIsLoading, availablePokemon, rankedPokemon, getAllRatings, getRating, setRankedPokemon, setAvailablePokemon, setConfidenceScores]);

  // Listen for TrueSkill store updates from Battle mode
  useEffect(() => {
    const handleStoreUpdate = (event: CustomEvent) => {
      console.log("[TRUESKILL_MANUAL_CLOUD] Received TrueSkill store update, re-syncing");
      
      // Small delay to ensure store is fully updated
      setTimeout(() => {
        if (!isLoading && !storeIsLoading && (availablePokemon.length > 0 || rankedPokemon.length > 0)) {
          const allRatings = getAllRatings();
          const ratedPokemonIds = Object.keys(allRatings).map(Number);
          
          if (ratedPokemonIds.length === 0) return;
          
          const allCurrentPokemon = [...availablePokemon, ...rankedPokemon];
          const ratedPokemon: Pokemon[] = [];
          const unratedPokemon: Pokemon[] = [];
          
          allCurrentPokemon.forEach(pokemon => {
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
  }, [getAllRatings, getRating, availablePokemon, rankedPokemon, isLoading, storeIsLoading, setRankedPokemon, setAvailablePokemon, setConfidenceScores]);

  return {
    isStoreLoading: storeIsLoading
  };
};
