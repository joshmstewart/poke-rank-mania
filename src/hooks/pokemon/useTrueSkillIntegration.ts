
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
  
  // ENHANCED: Effect to populate ranked Pokemon from TrueSkill store
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
      
      if (allCurrentPokemon.length === 0) {
        console.log("[TRUESKILL_MANUAL_CLOUD] No Pokemon data available yet, skipping update");
        return;
      }
      
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
    
    // CRITICAL FIX: Update when store loading completes AND when Pokemon data is available
    if (!isLoading && !storeIsLoading && (availablePokemon.length > 0 || rankedPokemon.length > 0)) {
      console.log("[TRUESKILL_MANUAL_CLOUD] Conditions met for ranking update - triggering sync");
      updateRankingsFromTrueSkill();
    }
  }, [isLoading, storeIsLoading, getAllRatings, getRating, availablePokemon, rankedPokemon, setRankedPokemon, setAvailablePokemon, setConfidenceScores]);

  // ENHANCED: Listen for TrueSkill store updates from Battle mode
  useEffect(() => {
    const handleStoreUpdate = (event: CustomEvent) => {
      console.log("[TRUESKILL_MANUAL_CLOUD] Received TrueSkill store update event, refreshing rankings");
      
      // Small delay to ensure store is updated
      setTimeout(() => {
        const allRatings = getAllRatings();
        if (Object.keys(allRatings).length > 0 && (availablePokemon.length > 0 || rankedPokemon.length > 0)) {
          console.log("[TRUESKILL_MANUAL_CLOUD] Re-syncing after store update");
          // Re-trigger the main effect by dispatching a custom event
          const syncEvent = new CustomEvent('manual-mode-sync-requested');
          document.dispatchEvent(syncEvent);
        }
      }, 100);
    };

    const handleManualSync = () => {
      console.log("[TRUESKILL_MANUAL_CLOUD] Manual sync requested, updating rankings");
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
        
        console.log("[TRUESKILL_MANUAL_CLOUD] Manual sync completed - Ranked:", ratedPokemon.length);
      }
    };
    
    // Listen for store updates and manual sync requests
    document.addEventListener('trueskill-store-updated', handleStoreUpdate as EventListener);
    document.addEventListener('trueskill-store-loaded', handleStoreUpdate as EventListener);
    document.addEventListener('manual-mode-sync-requested', handleManualSync);

    return () => {
      document.removeEventListener('trueskill-store-updated', handleStoreUpdate as EventListener);
      document.removeEventListener('trueskill-store-loaded', handleStoreUpdate as EventListener);
      document.removeEventListener('manual-mode-sync-requested', handleManualSync);
    };
  }, [getAllRatings, getRating, availablePokemon, rankedPokemon, isLoading, storeIsLoading, setRankedPokemon, setAvailablePokemon, setConfidenceScores]);

  return {
    isStoreLoading: storeIsLoading
  };
};
