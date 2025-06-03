
import React, { useState, useCallback } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { generations } from "@/services/pokemon";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import MilestoneHeader from "../battle/MilestoneHeader";
import DraggableMilestoneGrid from "../battle/DraggableMilestoneGrid";

interface PersonalRankingsViewProps {
  selectedGeneration: number;
}

const PersonalRankingsView: React.FC<PersonalRankingsViewProps> = ({
  selectedGeneration
}) => {
  const { getAllRatings, updateRating } = useTrueSkillStore();
  const [milestoneDisplayCount, setMilestoneDisplayCount] = useState(50);
  
  // Get current generation name
  const currentGeneration = generations.find(gen => gen.id === selectedGeneration);
  
  // Transform TrueSkill data to ranked Pokemon format
  const rankings = React.useMemo(() => {
    const ratings = getAllRatings();
    
    // Convert ratings to RankedPokemon format
    const rankedPokemon: RankedPokemon[] = Object.entries(ratings).map(([pokemonId, rating]) => {
      const score = rating.mu - 2 * rating.sigma; // Conservative score estimate
      const battleCount = rating.battleCount || 0;
      const wins = Math.max(0, Math.floor(battleCount * 0.6)); // Estimate wins (60% win rate)
      const losses = battleCount - wins;
      const winRate = battleCount > 0 ? (wins / battleCount) * 100 : 0;
      
      return {
        id: parseInt(pokemonId),
        name: `Pokemon ${pokemonId}`, // Placeholder - would need Pokemon data lookup
        image: "", // Placeholder
        types: [], // Placeholder
        score: score,
        generationId: 1, // Placeholder
        count: battleCount,
        confidence: Math.max(0, 100 - (rating.sigma * 20)), // Convert sigma to confidence percentage
        wins: wins,
        losses: losses,
        winRate: winRate
      };
    });
    
    // Sort by score descending
    return rankedPokemon.sort((a, b) => b.score - a.score);
  }, [getAllRatings]);

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
