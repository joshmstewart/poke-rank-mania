
import React, { useState, useCallback, useMemo } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { generations } from "@/services/pokemon";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { usePokemonContext } from "@/contexts/PokemonContext";
import MilestoneHeader from "../battle/MilestoneHeader";
import DraggableMilestoneGrid from "../battle/DraggableMilestoneGrid";

interface PersonalRankingsViewProps {
  selectedGeneration: number;
}

const PersonalRankingsView: React.FC<PersonalRankingsViewProps> = ({
  selectedGeneration
}) => {
  const { getAllRatings } = useTrueSkillStore();
  const [milestoneDisplayCount, setMilestoneDisplayCount] = useState(50);
  
  // Get Pokemon data from context
  const { allPokemon, pokemonLookupMap } = usePokemonContext();
  
  // Get current generation name
  const currentGeneration = generations.find(gen => gen.id === selectedGeneration);
  
  // Filter Pokemon by generation
  const filteredPokemon = useMemo(() => {
    if (selectedGeneration === 0) {
      return allPokemon; // All generations
    }
    
    const genRanges: { [key: number]: [number, number] } = {
      1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493],
      5: [494, 649], 6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025]
    };
    
    const range = genRanges[selectedGeneration];
    if (!range) return [];
    
    const [min, max] = range;
    return allPokemon.filter(p => p.id >= min && p.id <= max);
  }, [allPokemon, selectedGeneration]);
  
  // Transform TrueSkill data to ranked Pokemon format using actual Pokemon data
  const rankings = useMemo(() => {
    const ratings = getAllRatings();
    
    if (!filteredPokemon || filteredPokemon.length === 0) {
      return [];
    }
    
    // Convert ratings to RankedPokemon format
    const rankedPokemon: RankedPokemon[] = Object.entries(ratings)
      .map(([pokemonId, rating]) => {
        const pokemon = pokemonLookupMap.get(parseInt(pokemonId));
        if (!pokemon) return null; // Skip if Pokemon data not found
        
        // Filter by generation if needed
        if (selectedGeneration > 0) {
          const genRanges: { [key: number]: [number, number] } = {
            1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493],
            5: [494, 649], 6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025]
          };
          
          const range = genRanges[selectedGeneration];
          if (!range) return null;
          
          const [min, max] = range;
          if (pokemon.id < min || pokemon.id > max) return null;
        }
        
        const score = rating.mu - 2 * rating.sigma; // Conservative score estimate
        const battleCount = rating.battleCount || 0;
        const wins = Math.max(0, Math.floor(battleCount * 0.6)); // Estimate wins (60% win rate)
        const losses = battleCount - wins;
        const winRate = battleCount > 0 ? (wins / battleCount) * 100 : 0;
        
        return {
          ...pokemon, // Use actual Pokemon data (id, name, image, types, etc.)
          score: score,
          count: battleCount,
          confidence: Math.max(0, 100 - (rating.sigma * 20)), // Convert sigma to confidence percentage
          wins: wins,
          losses: losses,
          winRate: winRate
        };
      })
      .filter((pokemon): pokemon is RankedPokemon => pokemon !== null);
    
    // Sort by score descending
    return rankedPokemon.sort((a, b) => b.score - a.score);
  }, [getAllRatings, pokemonLookupMap, selectedGeneration]);

  const displayRankings = rankings.slice(0, milestoneDisplayCount);
  const localPendingRefinements = new Set<number>();
  
  const handleLoadMore = useCallback(() => {
    setMilestoneDisplayCount(prev => prev + 50);
  }, []);

  const handleContinueBattles = useCallback(() => {
    // This would close the modal and return to battle mode
    console.log("Continue battles clicked");
  }, []);

  const getMaxItemsForTier = useCallback(() => {
    return rankings.length;
  }, [rankings.length]);

  if (!allPokemon || allPokemon.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Loading Rankings...
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <MilestoneHeader
        battlesCompleted={rankings.length}
        displayCount={displayRankings.length}
        activeTier="All"
        maxItems={getMaxItemsForTier()}
        pendingRefinementsCount={0}
        onContinueBattles={handleContinueBattles}
      />

      {displayRankings.length > 0 ? (
        <DraggableMilestoneGrid
          displayRankings={displayRankings}
          localPendingRefinements={localPendingRefinements}
        />
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            No Personal Rankings Yet
          </h3>
          <p className="text-gray-500">
            Start battling Pokémon to build your personal rankings for {currentGeneration?.name || "All Generations"}.
          </p>
        </div>
      )}

      {displayRankings.length < rankings.length && (
        <div className="text-center mt-6">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default PersonalRankingsView;
