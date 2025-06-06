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
    if (!range) {
      return [];
    }
    
    const [min, max] = range;
    const filtered = allPokemon.filter(p => p.id >= min && p.id <= max);
    return filtered;
  }, [allPokemon, selectedGeneration]);
  
  // Transform TrueSkill data to ranked Pokemon format using actual Pokemon data
  const rankings = useMemo(() => {
    console.log('🔥🔥🔥 [PERSONAL_CRITICAL_DEBUG] ===== STARTING RANKINGS CALCULATION =====');
    const ratings = getAllRatings();
    
    if (!filteredPokemon || filteredPokemon.length === 0) {
      console.log('🔥🔥🔥 [PERSONAL_CRITICAL_DEBUG] No filtered Pokemon available');
      return [];
    }
    
    // Convert ratings to RankedPokemon format
    const rankedPokemon: RankedPokemon[] = Object.entries(ratings)
      .map(([pokemonId, rating]) => {
        const pokemon = pokemonLookupMap.get(parseInt(pokemonId));
        if (!pokemon) {
          return null; // Skip if Pokemon data not found
        }
        
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
        
        // CRITICAL: Apply name formatting and trace what happens
        console.log(`🔥🔥🔥 [NAME_TRACE] BEFORE formatting: "${pokemon.name}"`);
        const formattedName = formatPokemonName(pokemon.name);
        console.log(`🔥🔥🔥 [NAME_TRACE] AFTER formatting: "${formattedName}"`);
        
        // Special check for Deoxys
        if (pokemon.name.toLowerCase().includes('deoxys')) {
          console.log(`🔥🔥🔥 [DEOXYS_NAME_TRACE] Found Deoxys! ID=${pokemonId}, original="${pokemon.name}", formatted="${formattedName}"`);
        }
        
        const rankedPokemon = {
          ...pokemon, // Use actual Pokemon data (id, image, types, etc.)
          name: formattedName, // Apply name formatting here
          score: score,
          count: battleCount,
          confidence: Math.max(0, 100 - (rating.sigma * 20)), // Convert sigma to confidence percentage
          wins: wins,
          losses: losses,
          winRate: winRate
        };
        
        // CRITICAL: Check what name is actually in the final object
        if (pokemon.name.toLowerCase().includes('deoxys')) {
          console.log(`🔥🔥🔥 [DEOXYS_FINAL_OBJECT] Final rankedPokemon name: "${rankedPokemon.name}"`);
          console.log(`🔥🔥🔥 [DEOXYS_FINAL_OBJECT] Original pokemon.name: "${pokemon.name}"`);
          console.log(`🔥🔥🔥 [DEOXYS_FINAL_OBJECT] Formatted name was: "${formattedName}"`);
        }
        
        return rankedPokemon;
      })
      .filter((pokemon): pokemon is RankedPokemon => pokemon !== null);
    
    // Sort by score descending
    const sorted = rankedPokemon.sort((a, b) => b.score - a.score);
    console.log('🔥🔥🔥 [PERSONAL_CRITICAL_DEBUG] Final sorted rankings:', sorted.length, 'Pokemon');
    
    // Check what names are in the final sorted array
    const deoxysInFinal = sorted.filter(p => p.name.toLowerCase().includes('deoxys'));
    console.log(`🔥🔥🔥 [DEOXYS_IN_FINAL] Deoxys in final sorted array: ${deoxysInFinal.length}`);
    deoxysInFinal.forEach(p => {
      console.log(`🔥🔥🔥 [DEOXYS_IN_FINAL] Final name: "${p.name}" (ID: ${p.id})`);
    });
    
    return sorted;
  }, [getAllRatings, pokemonLookupMap, selectedGeneration, filteredPokemon]);

  // Update local rankings when rankings change
  useEffect(() => {
    console.log('🔥🔥🔥 [PERSONAL_EFFECT_DEBUG] ===== UPDATING LOCAL RANKINGS =====');
    console.log('🔥🔥🔥 [PERSONAL_EFFECT_DEBUG] Incoming rankings count:', rankings.length);
    
    if (rankings.length > 0) {
      // Check for Deoxys specifically in the incoming rankings
      const deoxysInRankings = rankings.filter(p => p.name.toLowerCase().includes('deoxys'));
      console.log(`🔥🔥🔥 [DEOXYS_EFFECT_DEBUG] Deoxys in incoming rankings: ${deoxysInRankings.length}`);
      deoxysInRankings.forEach(p => {
        console.log(`🔥🔥🔥 [DEOXYS_EFFECT_DEBUG] Incoming Deoxys: "${p.name}" (ID: ${p.id})`);
      });
    }
    
    setLocalRankings(rankings);
    console.log('🔥🔥🔥 [PERSONAL_EFFECT_DEBUG] Local rankings updated');
  }, [rankings]);

  // Handle rankings update from manual reorder
  const handleRankingsUpdate = useCallback((updatedRankings: RankedPokemon[]) => {
    console.log(`🔥🔥🔥 [PERSONAL_UPDATE_DEBUG] ===== HANDLING RANKINGS UPDATE =====`);
    console.log(`🔥🔥🔥 [PERSONAL_UPDATE_DEBUG] Received ${updatedRankings.length} updated Pokemon`);
    
    // Check what names we're getting in the update
    const deoxysInUpdate = updatedRankings.filter(p => p.name.toLowerCase().includes('deoxys'));
    console.log(`🔥🔥🔥 [DEOXYS_UPDATE_DEBUG] Deoxys in update: ${deoxysInUpdate.length}`);
    deoxysInUpdate.forEach(p => {
      console.log(`🔥🔥🔥 [DEOXYS_UPDATE_DEBUG] Update Deoxys: "${p.name}" (ID: ${p.id})`);
    });
    
    setLocalRankings(updatedRankings);
    console.log('🔥🔥🔥 [PERSONAL_UPDATE_DEBUG] Rankings update complete');
  }, []);

  // Use the battle manual reorder hook with milestone view behavior
  const { handleManualReorder } = useBattleManualReorder(
    localRankings,
    handleRankingsUpdate,
    true // isMilestoneView = true to get the proper drag behavior
  );

  // CRITICAL FIX: Ensure we're passing the correct formatted Pokemon objects to the grid
  const displayRankings = useMemo(() => {
    const sliced = localRankings.slice(0, milestoneDisplayCount);
    console.log(`🔥🔥🔥 [DISPLAY_RANKINGS_DEBUG] Creating displayRankings with ${sliced.length} Pokemon`);
    
    // Check if Deoxys is in the display rankings and what its name is
    const deoxysInDisplay = sliced.filter(p => p.name.toLowerCase().includes('deoxys'));
    console.log(`🔥🔥🔥 [DISPLAY_RANKINGS_DEBUG] Deoxys in displayRankings: ${deoxysInDisplay.length}`);
    deoxysInDisplay.forEach(p => {
      console.log(`🔥🔥🔥 [DISPLAY_RANKINGS_DEBUG] Display Deoxys: "${p.name}" (ID: ${p.id})`);
    });
    
    return sliced;
  }, [localRankings, milestoneDisplayCount]);

  const localPendingRefinements = new Set<number>();
  const hasMoreToLoad = milestoneDisplayCount < localRankings.length;
  
  const handleLoadMore = useCallback(() => {
    if (hasMoreToLoad) {
      setMilestoneDisplayCount(prev => Math.min(prev + 50, localRankings.length));
    }
  }, [hasMoreToLoad, localRankings.length]);

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

  // CRITICAL: Check what's actually being displayed
  console.log('🔥🔥🔥 [DISPLAY_DEBUG] ===== WHAT IS BEING DISPLAYED =====');
  console.log('🔥🔥🔥 [DISPLAY_DEBUG] displayRankings length:', displayRankings.length);
  const deoxysInDisplay = displayRankings.filter(p => p.name.toLowerCase().includes('deoxys'));
  console.log(`🔥🔥🔥 [DEOXYS_DISPLAY_DEBUG] Deoxys in display: ${deoxysInDisplay.length}`);
  deoxysInDisplay.forEach((p, index) => {
    console.log(`🔥🔥🔥 [DEOXYS_DISPLAY_DEBUG] Display #${index + 1}: "${p.name}" (ID: ${p.id})`);
  });

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
