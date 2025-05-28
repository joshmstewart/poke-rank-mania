
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Pokemon, TopNOption, RankedPokemon } from "@/services/pokemon";
import PokemonThumbnail from "./PokemonThumbnail";
import RankingHeader from "./RankingHeader";
import ShowMoreButton from "./ShowMoreButton";
import ViewRankings from "./ViewRankings";
import { Button } from "@/components/ui/button";

interface RankingDisplayProps {
  finalRankings: Pokemon[] | RankedPokemon[];
  battlesCompleted: number;
  onContinueBattles: () => void;
  onNewBattleSet: () => void;
  rankingGenerated: boolean;
  onSaveRankings: () => void;
  isMilestoneView?: boolean;
  activeTier?: TopNOption;
  onTierChange?: (tier: TopNOption) => void;
  onSuggestRanking?: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion?: (pokemonId: number) => void;
}

const RankingDisplay: React.FC<RankingDisplayProps> = ({
  finalRankings,
  battlesCompleted,
  onContinueBattles,
  onNewBattleSet,
  rankingGenerated,
  onSaveRankings,
  isMilestoneView = false,
  activeTier = 25,
  onTierChange,
  onSuggestRanking,
  onRemoveSuggestion
}) => {
  console.log("🟣 RankingDisplay component rendered with", finalRankings.length, "Pokémon");
  const [displayCount, setDisplayCount] = useState(20);
  const [milestoneDisplayCount, setMilestoneDisplayCount] = useState(50);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  
  // Handle the case where we're displaying milestone view with ranked pokemon
  const hasRankedPokemon = finalRankings.length > 0 && 'score' in finalRankings[0];
  
  // Calculate how many items to show for milestone view based on tier
  const getMaxItemsForTier = useCallback(() => {
    if (activeTier === "All") {
      return finalRankings.length;
    }
    return Math.min(Number(activeTier), finalRankings.length);
  }, [activeTier, finalRankings.length]);

  // Add debugging to show Pokemon with types - this must be called unconditionally
  useEffect(() => {
    const displayRankings = finalRankings.slice(0, displayCount);
    console.log("Pokemon list with types:");
    if (displayRankings.length > 0) {
      displayRankings.slice(0, Math.min(5, displayRankings.length)).forEach((pokemon, index) => {
        console.log(`${index + 1}. ${pokemon.name} (ID: ${pokemon.id}) - Types: ${pokemon.types?.join(', ') || 'unknown'}`);
        
        // ENHANCED DEBUGGING: Log the complete structure of the first Pokemon
        if (index === 0) {
          console.log("🔍 COMPLETE POKEMON STRUCTURE for", pokemon.name, ":");
          console.log("- Raw types property:", JSON.stringify(pokemon.types));
          console.log("- Types is array:", Array.isArray(pokemon.types));
          console.log("- Types length:", pokemon.types?.length || 0);
          console.log("- First type element:", pokemon.types?.[0]);
          console.log("- Type of first element:", typeof pokemon.types?.[0]);
          if (pokemon.types?.[0] && typeof pokemon.types[0] === 'object') {
            console.log("- First type object keys:", Object.keys(pokemon.types[0]));
            console.log("- First type object structure:", JSON.stringify(pokemon.types[0]));
          }
        }
      });
    }
  }, [finalRankings, displayCount]);

  // Setup infinite scroll observer for milestone view
  useEffect(() => {
    if (!isMilestoneView) return;

    const maxItems = getMaxItemsForTier();
    
    // Clean up previous observer
    if (observerRef.current && loadingRef.current) {
      observerRef.current.unobserve(loadingRef.current);
      observerRef.current = null;
    }

    // Only set up observer if we haven't loaded all items yet
    if (milestoneDisplayCount < maxItems) {
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          console.log(`Loading more milestone items: ${milestoneDisplayCount} -> ${Math.min(milestoneDisplayCount + 50, maxItems)}`);
          setMilestoneDisplayCount(prev => Math.min(prev + 50, maxItems));
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
      if (observerRef.current && loadingRef.current) {
        observerRef.current.unobserve(loadingRef.current);
      }
    };
  }, [isMilestoneView, milestoneDisplayCount, getMaxItemsForTier]);

  // Reset milestone display count when tier changes
  useEffect(() => {
    if (isMilestoneView) {
      setMilestoneDisplayCount(50);
    }
  }, [activeTier, isMilestoneView]);
  
  // Handler for the "Show More" button
  const handleShowMore = () => {
    const increment = 50;
    const newCount = Math.min(displayCount + increment, finalRankings.length);
    console.log(`Increasing display count from ${displayCount} to ${newCount} of ${finalRankings.length} total`);
    setDisplayCount(newCount);
  };

  // UPDATED: Medium saturation Pokemon background colors - middle ground between soft and vibrant
  const getPokemonBackgroundColor = (pokemon: RankedPokemon | Pokemon): string => {
    console.log(`🎨 COLOR DEBUG for ${pokemon.name}:`, {
      hasTypes: !!pokemon.types,
      typesArray: pokemon.types,
      typesLength: pokemon.types?.length || 0
    });

    if (!pokemon.types || pokemon.types.length === 0) {
      console.log(`❌ ${pokemon.name}: No types found, using gray-100`);
      return 'bg-gray-100';
    }
    
    let primaryType = 'unknown';
    
    if (typeof pokemon.types[0] === 'string') {
      primaryType = pokemon.types[0].toLowerCase();
      console.log(`✅ ${pokemon.name}: Direct string type: ${primaryType}`);
    } else if (pokemon.types[0] && typeof pokemon.types[0] === 'object') {
      const typeObj = pokemon.types[0] as any;
      if (typeObj.type && typeObj.type.name) {
        primaryType = typeObj.type.name.toLowerCase();
        console.log(`✅ ${pokemon.name}: Nested type.name: ${primaryType}`);
      } else if (typeObj.name) {
        primaryType = typeObj.name.toLowerCase();
        console.log(`✅ ${pokemon.name}: Direct name: ${primaryType}`);
      } else {
        console.log(`❌ ${pokemon.name}: Object type but no recognizable structure:`, typeObj);
      }
    } else {
      console.log(`❌ ${pokemon.name}: Unrecognized type structure:`, pokemon.types[0]);
    }
    
    // UPDATED: Medium saturation colors - more visible than -50 but not overwhelming
    const typeToColorMap: Record<string, string> = {
      'normal': 'bg-gray-100',
      'fighting': 'bg-red-100',
      'flying': 'bg-blue-100', 
      'poison': 'bg-purple-100',
      'ground': 'bg-yellow-100',
      'rock': 'bg-amber-100',
      'bug': 'bg-green-100',
      'ghost': 'bg-purple-100',
      'steel': 'bg-slate-100',
      'fire': 'bg-red-100',
      'water': 'bg-blue-100',
      'grass': 'bg-green-100',
      'electric': 'bg-yellow-100',
      'psychic': 'bg-pink-100',
      'ice': 'bg-cyan-100',
      'dragon': 'bg-indigo-100',
      'dark': 'bg-gray-200',
      'fairy': 'bg-pink-100'
    };
    
    const finalColor = typeToColorMap[primaryType] || 'bg-gray-100';
    console.log(`🎨 ${pokemon.name}: Final color for type '${primaryType}': ${finalColor}`);
    return finalColor;
  };

  // Milestone view - EXACTLY like the reference image with softer colors
  if (isMilestoneView) {
    const maxItems = getMaxItemsForTier();
    const displayRankings = finalRankings.slice(0, Math.min(milestoneDisplayCount, maxItems));
    const hasMoreToLoad = milestoneDisplayCount < maxItems;
    
    console.log(`🏆 [MILESTONE_NAME_DEBUG] Displaying ${displayRankings.length} Pokemon in milestone view`);
    displayRankings.slice(0, 3).forEach((pokemon, index) => {
      console.log(`🏆 [MILESTONE_NAME_DEBUG] #${index + 1}: "${pokemon.name}" (ID: ${pokemon.id})`);
    });
    
    return (
      <div className="bg-white p-6 w-full max-w-7xl mx-auto">
        {/* Header - exactly matching the image */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <h1 className="text-xl font-bold text-gray-800">
              Milestone: {battlesCompleted} Battles
            </h1>
            <span className="text-gray-500 text-sm">
              (Showing {displayRankings.length} of {activeTier === "All" ? maxItems : Math.min(Number(activeTier), maxItems)})
            </span>
          </div>
          
          <Button 
            onClick={onContinueBattles}
            className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium"
          >
            Continue Battles
          </Button>
        </div>

        {/* Grid Layout - exactly 5 columns like the reference with softer colors */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {displayRankings.map((pokemon, index) => {
            const backgroundColorClass = getPokemonBackgroundColor(pokemon);
            
            // CRITICAL: Log each Pokemon name being displayed in milestone
            console.log(`🏆 [MILESTONE_RENDER_DEBUG] Pokemon #${index + 1}: "${pokemon.name}" (ID: ${pokemon.id})`);
            
            return (
              <div 
                key={pokemon.id}
                className={`${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-40 flex flex-col`}
              >
                {/* Ranking number - white circle with black text in top left exactly like image */}
                <div className="absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-sm border border-gray-200">
                  <span className="text-black">{index + 1}</span>
                </div>
                
                {/* Pokemon image - larger and taking up more space */}
                <div className="flex-1 flex justify-center items-center px-2 pt-6 pb-1">
                  <img 
                    src={pokemon.image} 
                    alt={pokemon.name}
                    className="w-20 h-20 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                
                {/* Pokemon info - white section at bottom exactly like image */}
                <div className="bg-white text-center py-2 px-2 mt-auto border-t border-gray-100">
                  <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1">
                    {pokemon.name}
                  </h3>
                  <div className="text-xs text-gray-600">
                    #{pokemon.id}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Infinite scroll loading indicator */}
        {hasMoreToLoad && (
          <div 
            ref={loadingRef}
            className="text-center py-4"
          >
            <div className="text-sm text-gray-500">
              Loading more Pokémon... ({displayRankings.length}/{maxItems})
            </div>
          </div>
        )}

        {/* End message when all loaded */}
        {!hasMoreToLoad && (
          <div className="text-center py-4">
            <div className="text-sm text-gray-500">
              All {displayRankings.length} Pokémon loaded
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Take the top rankings to display for non-milestone view
  const displayRankings = finalRankings.slice(0, displayCount);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <RankingHeader 
        title="Current Rankings"
        displayCount={displayCount}
        totalCount={finalRankings.length}
        isMilestoneView={isMilestoneView}
        battlesCompleted={battlesCompleted}
        rankingGenerated={rankingGenerated}
        onContinueBattles={onContinueBattles}
        onNewBattleSet={onNewBattleSet}
        onSaveRankings={onSaveRankings}
      />

      {/* Standard grid for non-milestone view */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {displayRankings.map((pokemon, index) => (
          <div 
            key={pokemon.id}
            className="bg-white rounded-lg p-4 border border-gray-200 transition-all duration-200 hover:shadow-lg"
          >
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-700 mb-2">
                #{index + 1}
              </div>
              
              <div className="w-20 h-20 mx-auto mb-3 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src={pokemon.image} 
                  alt={pokemon.name}
                  className="w-16 h-16 object-contain"
                />
              </div>
              
              <h3 className="font-semibold text-gray-800 text-sm mb-1">
                {pokemon.name}
              </h3>
              
              <div className="text-xs text-gray-600 mb-2">
                {pokemon.types?.join(', ') || 'Unknown'}
              </div>
              
              {hasRankedPokemon && (
                <div className="text-xs text-gray-500">
                  Score: {Math.round((pokemon as RankedPokemon).score || 0)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {displayCount < finalRankings.length && (
        <div className="text-center pt-4">
          <ShowMoreButton 
            onShowMore={handleShowMore}
            displayCount={displayCount}
            totalCount={finalRankings.length}
          />
        </div>
      )}
    </div>
  );
};

export default RankingDisplay;
