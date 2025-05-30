
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
  
  // Effect to populate ranked Pokemon from TrueSkill store - ENHANCED with immediate sync
  useEffect(() => {
    const updateRankingsFromTrueSkill = () => {
      console.log("[TRUESKILL_MANUAL_CLOUD] Updating Manual Mode rankings from cloud TrueSkill store");
      
      const allRatings = getAllRatings();
      const ratedPokemonIds = Object.keys(allRatings).map(Number);
      
      console.log("[TRUESKILL_MANUAL_CLOUD] Found TrueSkill ratings for Pokemon IDs:", ratedPokemonIds);
      
      if (ratedPokemonIds.length === 0) {
        console.log("[TRUESKILL_MANUAL_CLOUD] No TrueSkill ratings found, keeping current state");
        return;
      }
      
      // Get all Pokemon (available + ranked) to work with
      const allCurrentPokemon = [...availablePokemon, ...rankedPokemon];
      
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
      
      console.log("[TRUESKILL_MANUAL_CLOUD] Sorted rated Pokemon:", ratedPokemon.map(p => ({
        name: p.name,
        id: p.id,
        score: p.rating ? (p.rating.mu - 3 * p.rating.sigma).toFixed(2) : 'N/A'
      })));
      
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
      
      console.log("[TRUESKILL_MANUAL_CLOUD] Updated Manual Mode from cloud - Ranked:", ratedPokemon.length, "Available:", unratedPokemon.length);
    };
    
    // ENHANCED: Update immediately when store loads AND when Pokemon data changes
    if (!isLoading && !storeIsLoading && (availablePokemon.length > 0 || rankedPokemon.length > 0)) {
      updateRankingsFromTrueSkill();
    }
  }, [isLoading, storeIsLoading, getAllRatings, getRating, availablePokemon.length, rankedPokemon.length, setRankedPokemon, setAvailablePokemon, setConfidenceScores]);

  // ENHANCED: Listen for TrueSkill store updates from Battle mode
  useEffect(() => {
    const handleStoreUpdate = () => {
      console.log("[TRUESKILL_MANUAL_CLOUD] Received TrueSkill store update, refreshing rankings");
      // Small delay to ensure store is updated
      setTimeout(() => {
        const allRatings = getAllRatings();
        if (Object.keys(allRatings).length > 0) {
          // Trigger a re-sync by updating dependencies
          const event = new CustomEvent('trueskill-store-updated');
          document.dispatchEvent(event);
        }
      }, 100);
    };

    // Listen for store updates
    const handleCustomEvent = () => handleStoreUpdate();
    document.addEventListener('trueskill-store-updated', handleCustomEvent);

    return () => {
      document.removeEventListener('trueskill-store-updated', handleCustomEvent);
    };
  }, [getAllRatings]);

  return {
    isStoreLoading: storeIsLoading
  };
};
