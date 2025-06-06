
import { useState, useEffect, useMemo } from 'react';
import { RankedPokemon } from '@/services/pokemon';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { formatPokemonName } from '@/utils/pokemon';

interface UseRankingDataProcessingProps {
  availablePokemon: any[];
  rankedPokemon: any[];
  selectedGeneration: number;
  totalPages: number;
  preventAutoResorting?: boolean;
}

export const useRankingDataProcessing = ({
  availablePokemon,
  rankedPokemon,
  selectedGeneration,
  totalPages,
  preventAutoResorting = false
}: UseRankingDataProcessingProps) => {
  const { getRating } = useTrueSkillStore();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);

  console.log(`🔮 [RANKING_DATA_PROCESSING] Hook called with ${rankedPokemon.length} ranked Pokemon`);
  console.log(`🔮 [RANKING_DATA_PROCESSING] preventAutoResorting: ${preventAutoResorting}`);

  // Enhanced available Pokemon with ranking status
  const enhancedAvailablePokemon = useMemo(() => {
    const rankedIds = new Set(rankedPokemon.map(p => p.id));
    
    return availablePokemon.map(pokemon => {
      const isRanked = rankedIds.has(pokemon.id);
      const currentRank = isRanked ? rankedPokemon.findIndex(p => p.id === pokemon.id) + 1 : null;
      
      // CRITICAL: Apply proper formatting and log it
      const originalName = pokemon.name;
      const formattedName = formatPokemonName(pokemon.name);
      console.log(`🔮 [RANKING_DATA_PROCESSING_AVAILABLE_FORMAT] ${originalName} -> ${formattedName}`);
      
      return {
        ...pokemon,
        name: formattedName, // Apply proper formatting
        isRanked,
        currentRank: currentRank > 0 ? currentRank : null
      };
    });
  }, [availablePokemon, rankedPokemon]);

  // Convert and format ranked Pokemon with proper scoring
  const processedRankings = useMemo(() => {
    if (!rankedPokemon.length) return [];
    
    console.log(`🔮 [RANKING_DATA_PROCESSING] Processing ${rankedPokemon.length} ranked Pokemon`);
    
    return rankedPokemon.map((pokemon, index) => {
      const rating = getRating(pokemon.id.toString());
      const conservativeEstimate = rating.mu - rating.sigma;
      const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
      
      // CRITICAL: Apply proper formatting and log it
      const originalName = pokemon.name;
      const formattedName = formatPokemonName(pokemon.name);
      console.log(`🔮 [RANKING_DATA_PROCESSING_RANKED_FORMAT] ${originalName} -> ${formattedName}`);
      
      return {
        ...pokemon,
        name: formattedName, // Apply proper formatting
        score: conservativeEstimate,
        confidence: confidence,
        rating: rating,
        count: pokemon.count || 0,
        wins: pokemon.wins || 0,
        losses: pokemon.losses || 0,
        winRate: pokemon.winRate || 0
      } as RankedPokemon;
    });
  }, [rankedPokemon, getRating]);

  // Initialize local rankings
  useEffect(() => {
    if (processedRankings.length > 0) {
      console.log(`🔮 [RANKING_DATA_PROCESSING] Setting local rankings: ${processedRankings.length} Pokemon`);
      setLocalRankings(processedRankings);
    }
  }, [processedRankings]);

  // Update local rankings function
  const updateLocalRankings = (newRankings: RankedPokemon[]) => {
    console.log(`🔮 [RANKING_DATA_PROCESSING] Updating local rankings: ${newRankings.length} Pokemon`);
    // Apply proper formatting to updated rankings
    const formattedRankings = newRankings.map(pokemon => {
      const formatted = formatPokemonName(pokemon.name);
      console.log(`🔮 [RANKING_DATA_PROCESSING_UPDATE_FORMAT] ${pokemon.name} -> ${formatted}`);
      return {
        ...pokemon,
        name: formatted
      };
    });
    setLocalRankings(formattedRankings);
  };

  // Display rankings with proper formatting
  const displayRankings = useMemo(() => {
    return localRankings.map(pokemon => {
      const formatted = formatPokemonName(pokemon.name);
      console.log(`🔮 [RANKING_DATA_PROCESSING_DISPLAY_FORMAT] ${pokemon.name} -> ${formatted}`);
      return {
        ...pokemon,
        name: formatted // Ensure formatting is always applied
      };
    });
  }, [localRankings]);

  // Filtered available Pokemon for the current generation
  const filteredAvailablePokemon = useMemo(() => {
    if (selectedGeneration === 0) return enhancedAvailablePokemon;
    
    return enhancedAvailablePokemon.filter(pokemon => 
      pokemon.generation === selectedGeneration
    );
  }, [enhancedAvailablePokemon, selectedGeneration]);

  console.log(`🔮 [RANKING_DATA_PROCESSING] Returning processed data:`);
  console.log(`🔮 [RANKING_DATA_PROCESSING] - Local rankings: ${localRankings.length}`);
  console.log(`🔮 [RANKING_DATA_PROCESSING] - Display rankings: ${displayRankings.length}`);
  console.log(`🔮 [RANKING_DATA_PROCESSING] - Enhanced available: ${enhancedAvailablePokemon.length}`);
  console.log(`🔮 [RANKING_DATA_PROCESSING] - Filtered available: ${filteredAvailablePokemon.length}`);

  return {
    localRankings,
    updateLocalRankings,
    displayRankings,
    filteredAvailablePokemon,
    enhancedAvailablePokemon
  };
};
