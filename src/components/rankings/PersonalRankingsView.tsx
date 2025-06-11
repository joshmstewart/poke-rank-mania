import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { generations } from "@/services/pokemon";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { formatPokemonName } from "@/utils/pokemon";
import DraggableMilestoneGrid from "../battle/DraggableMilestoneGrid";
import { useBattleManualReorder } from "@/hooks/battle/useBattleManualReorder";

interface PersonalRankingsViewProps {
  selectedGeneration: number;
}

const PersonalRankingsView: React.FC<PersonalRankingsViewProps> = ({
  selectedGeneration
}) => {
  const { getAllRatings } = useTrueSkillStore();
  const [milestoneDisplayCount, setMilestoneDisplayCount] = useState(50);
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);
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
  
  // Transform TrueSkill data to ranked Pokemon format with DETAILED AUDIT LOGGING
  const rankings = useMemo(() => {
    const auditId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] ===== STARTING RANKING FILTER AUDIT =====`);
    
    const ratings = getAllRatings();
    const rawRatingIds = Object.keys(ratings);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] STEP 1 - Raw ratings from TrueSkill store: ${rawRatingIds.length}`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] Raw rating IDs sample:`, rawRatingIds.slice(0, 10).join(', '));
    
    if (!filteredPokemon || filteredPokemon.length === 0) {
      console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] EARLY EXIT - No filtered Pokemon available`);
      return [];
    }
    
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] STEP 2 - Pokemon lookup map size: ${pokemonLookupMap.size}`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] STEP 3 - Selected generation: ${selectedGeneration} (${currentGeneration?.name || 'All Generations'})`);
    
    // Track lookup failures
    const lookupFailures: string[] = [];
    const generationFilteredOut: string[] = [];
    const battleCountFilteredOut: string[] = [];
    const successfullyProcessed: string[] = [];
    
    // Convert ratings to RankedPokemon format
    const rankedPokemon: RankedPokemon[] = Object.entries(ratings)
      .map(([pokemonId, rating]) => {
        const pokemon = pokemonLookupMap.get(parseInt(pokemonId));
        if (!pokemon) {
          lookupFailures.push(pokemonId);
          return null; // Skip if Pokemon data not found
        }
        
        // Check generation filtering
        if (selectedGeneration > 0) {
          const genRanges: { [key: number]: [number, number] } = {
            1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493],
            5: [494, 649], 6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025]
          };
          
          const range = genRanges[selectedGeneration];
          if (!range) {
            generationFilteredOut.push(pokemonId);
            return null;
          }
          
          const [min, max] = range;
          if (pokemon.id < min || pokemon.id > max) {
            generationFilteredOut.push(pokemonId);
            return null;
          }
        }
        
        // Check battle count (implicit filter for display)
        const battleCount = rating.battleCount || 0;
        if (battleCount === 0) {
          battleCountFilteredOut.push(pokemonId);
          // Note: We're not filtering these out, just tracking them
        }
        
        const formattedName = formatPokemonName(pokemon.name);
        const score = rating.mu - 2 * rating.sigma; // Conservative score estimate
        const wins = Math.max(0, Math.floor(battleCount * 0.6)); // Estimate wins (60% win rate)
        const losses = battleCount - wins;
        const winRate = battleCount > 0 ? (wins / battleCount) * 100 : 0;
        
        const result = {
          id: pokemon.id,
          name: formattedName,
          image: pokemon.image,
          types: pokemon.types || [], // Ensure types is always an array
          score: score,
          count: battleCount,
          confidence: Math.max(0, 100 - (rating.sigma * 20)), // Convert sigma to confidence percentage
          wins: wins,
          losses: losses,
          winRate: winRate,
          rating: rating
        } as RankedPokemon;
        
        successfullyProcessed.push(pokemonId);
        return result;
      })
      .filter((pokemon): pokemon is RankedPokemon => pokemon !== null);
    
    // DETAILED AUDIT REPORTING
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] ===== FILTER AUDIT RESULTS =====`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] STEP 4 - Lookup failures: ${lookupFailures.length}`);
    if (lookupFailures.length > 0) {
      console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] Failed lookup IDs:`, lookupFailures.slice(0, 10).join(', '), lookupFailures.length > 10 ? `... and ${lookupFailures.length - 10} more` : '');
    }
    
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] STEP 5 - Generation filtered out: ${generationFilteredOut.length}`);
    if (generationFilteredOut.length > 0) {
      console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] Generation filtered IDs:`, generationFilteredOut.slice(0, 10).join(', '), generationFilteredOut.length > 10 ? `... and ${generationFilteredOut.length - 10} more` : '');
    }
    
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] STEP 6 - Zero battle count: ${battleCountFilteredOut.length}`);
    if (battleCountFilteredOut.length > 0) {
      console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] Zero battle IDs:`, battleCountFilteredOut.slice(0, 10).join(', '), battleCountFilteredOut.length > 10 ? `... and ${battleCountFilteredOut.length - 10} more` : '');
    }
    
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] STEP 7 - Successfully processed: ${successfullyProcessed.length}`);
    
    // Sort by score descending
    const sortedRankings = rankedPokemon.sort((a, b) => b.score - a.score);
    
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] STEP 8 - Final sorted rankings: ${sortedRankings.length}`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] ===== AUDIT SUMMARY =====`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] Started with: ${rawRatingIds.length} raw ratings`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] Lost to lookup failures: ${lookupFailures.length}`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] Lost to generation filter: ${generationFilteredOut.length}`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] Zero battle count (kept): ${battleCountFilteredOut.length}`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] Final display count: ${sortedRankings.length}`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] Total lost: ${rawRatingIds.length - sortedRankings.length}`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] ===== END AUDIT =====`);
    
    return sortedRankings;
  }, [getAllRatings, pokemonLookupMap, selectedGeneration, filteredPokemon, currentGeneration]);

  // Update local rankings when rankings change
  useEffect(() => {
    setLocalRankings(rankings);
  }, [rankings]);

  // Handle rankings update from manual reorder
  const handleRankingsUpdate = useCallback((updatedRankings: RankedPokemon[]) => {
    console.log(`🏆 [PERSONAL_RANKINGS] Received rankings update with ${updatedRankings.length} Pokemon`);
    setLocalRankings(updatedRankings);
  }, []);

  // Use the battle manual reorder hook with milestone view behavior
  const { handleManualReorder } = useBattleManualReorder(
    localRankings,
    handleRankingsUpdate,
    true // isMilestoneView = true to get the proper drag behavior
  );

  const displayRankings = localRankings.slice(0, milestoneDisplayCount);
  const localPendingRefinements = new Set<number>();
  const hasMoreToLoad = milestoneDisplayCount < localRankings.length;
  
  const handleLoadMore = useCallback(() => {
    if (hasMoreToLoad) {
      setMilestoneDisplayCount(prev => Math.min(prev + 50, localRankings.length));
    }
  }, [hasMoreToLoad, localRankings.length]);

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
          console.log(`Loading more rankings: ${milestoneDisplayCount} -> ${Math.min(milestoneDisplayCount + 50, localRankings.length)}`);
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
  }, [hasMoreToLoad, milestoneDisplayCount, localRankings.length, handleLoadMore]);

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <h1 className="text-xl font-bold text-gray-800">
            Personal Rankings: {localRankings.length} Battles
          </h1>
          <span className="text-gray-500 text-sm">
            (Showing {displayRankings.length} of {localRankings.length})
          </span>
        </div>
      </div>

      {displayRankings.length > 0 ? (
        <>
          <DraggableMilestoneGrid
            displayRankings={displayRankings}
            localPendingRefinements={localPendingRefinements}
            onManualReorder={handleManualReorder}
          />
          
          {/* Infinite scroll loading indicator */}
          {hasMoreToLoad && (
            <div 
              ref={loadingRef}
              className="text-center py-4"
            >
              <div className="text-sm text-gray-500">
                Loading more Pokémon... ({displayRankings.length}/{localRankings.length})
              </div>
            </div>
          )}
          
          {!hasMoreToLoad && localRankings.length > 0 && (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">
                All {localRankings.length} ranked Pokémon loaded
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
