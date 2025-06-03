
import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { generations } from "@/services/pokemon";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { usePokemonContext } from "@/contexts/PokemonContext";
import DraggableMilestoneGrid from "../battle/DraggableMilestoneGrid";

interface PersonalRankingsViewProps {
  selectedGeneration: number;
}

const PersonalRankingsView: React.FC<PersonalRankingsViewProps> = ({
  selectedGeneration
}) => {
  const { getAllRatings } = useTrueSkillStore();
  const [milestoneDisplayCount, setMilestoneDisplayCount] = useState(50);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  
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
  const hasMoreToLoad = milestoneDisplayCount < rankings.length;
  
  const handleLoadMore = useCallback(() => {
    if (hasMoreToLoad) {
      setMilestoneDisplayCount(prev => Math.min(prev + 50, rankings.length));
    }
  }, [hasMoreToLoad, rankings.length]);

  // Set up infinite scroll observer
  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current && loadingRef.current) {
      observerRef.current.unobserve(loadingRef.current);
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Only set up observer if we have more items to load
    if (hasMoreToLoad) {
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          console.log(`Loading more rankings: ${milestoneDisplayCount} -> ${Math.min(milestoneDisplayCount + 50, rankings.length)}`);
          handleLoadMore();
        }
      }, { 
        rootMargin: '200px',
        threshold: 0.1 
      });
      
      if (loadingRef.current) {
        observerRef.current.observe(loadingRef.current);
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMoreToLoad, milestoneDisplayCount, rankings.length, handleLoadMore]);

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
      {/* Simple header without Continue Battles button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <h1 className="text-xl font-bold text-gray-800">
            Personal Rankings: {rankings.length} Battles
          </h1>
          <span className="text-gray-500 text-sm">
            (Showing {displayRankings.length} of {rankings.length})
          </span>
        </div>
      </div>

      {displayRankings.length > 0 ? (
        <>
          <DraggableMilestoneGrid
            displayRankings={displayRankings}
            localPendingRefinements={localPendingRefinements}
          />
          
          {/* Infinite scroll loading indicator */}
          {hasMoreToLoad && (
            <div 
              ref={loadingRef}
              className="text-center py-4"
            >
              <div className="text-sm text-gray-500">
                Loading more Pokémon... ({displayRankings.length}/{rankings.length})
              </div>
            </div>
          )}
          
          {!hasMoreToLoad && rankings.length > 0 && (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">
                All {rankings.length} ranked Pokémon loaded
              </div>
            </div>
          )}
        </>
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
    </div>
  );
};

export default PersonalRankingsView;
