
import React, { useState, useEffect } from "react";
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
  
  // Handle the case where we're displaying milestone view with ranked pokemon
  const hasRankedPokemon = finalRankings.length > 0 && 'score' in finalRankings[0];
  
  // Add debugging to show Pokemon with their types - this must be called unconditionally
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
  
  // Handler for the "Show More" button
  const handleShowMore = () => {
    const increment = 50;
    const newCount = Math.min(displayCount + increment, finalRankings.length);
    console.log(`Increasing display count from ${displayCount} to ${newCount} of ${finalRankings.length} total`);
    setDisplayCount(newCount);
  };

  // Enhanced Pokemon background color based on primary type - matching the reference images exactly
  const getPokemonBackgroundColor = (pokemon: RankedPokemon | Pokemon): string => {
    console.log(`🎨 COLOR DEBUG for ${pokemon.name}:`, {
      hasTypes: !!pokemon.types,
      typesArray: pokemon.types,
      typesLength: pokemon.types?.length || 0
    });

    if (!pokemon.types || pokemon.types.length === 0) {
      console.log(`❌ ${pokemon.name}: No types found, using gray-300`);
      return 'bg-gray-300';
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
    
    // Vibrant type colors matching the reference image exactly
    const typeToColorMap: Record<string, string> = {
      'normal': 'bg-yellow-100',
      'fighting': 'bg-red-300',
      'flying': 'bg-blue-300', 
      'poison': 'bg-purple-300',
      'ground': 'bg-yellow-300',
      'rock': 'bg-yellow-400',
      'bug': 'bg-green-300',
      'ghost': 'bg-purple-400',
      'steel': 'bg-gray-400',
      'fire': 'bg-red-300',
      'water': 'bg-blue-300',
      'grass': 'bg-green-300',
      'electric': 'bg-yellow-300',
      'psychic': 'bg-pink-300',
      'ice': 'bg-cyan-300',
      'dragon': 'bg-indigo-300',
      'dark': 'bg-gray-500',
      'fairy': 'bg-pink-300'
    };
    
    const finalColor = typeToColorMap[primaryType] || 'bg-gray-300';
    console.log(`🎨 ${pokemon.name}: Final color for type '${primaryType}': ${finalColor}`);
    return finalColor;
  };

  // Milestone view - EXACTLY like the reference image
  if (isMilestoneView) {
    const displayRankings = finalRankings.slice(0, displayCount);
    
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
              (Showing {Math.min(displayCount, displayRankings.length)} of {activeTier === "All" ? displayRankings.length : activeTier})
            </span>
          </div>
          
          <Button 
            onClick={onContinueBattles}
            className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium"
          >
            Continue Battles
          </Button>
        </div>

        {/* Grid Layout - exactly 5 columns like the reference with proper proportions */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {displayRankings.map((pokemon, index) => {
            const backgroundColorClass = getPokemonBackgroundColor(pokemon);
            
            return (
              <div 
                key={pokemon.id}
                className={`${backgroundColorClass} rounded-lg border border-gray-300 relative overflow-hidden h-40 flex flex-col`}
              >
                {/* Ranking number - white circle with black text in top left exactly like image */}
                <div className="absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-sm">
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
                <div className="bg-white text-center py-2 px-2 mt-auto">
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

        {/* Show More button - exactly like the image */}
        {displayCount < finalRankings.length && (
          <div className="text-center">
            <button
              onClick={handleShowMore}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Show More ({displayCount}/{finalRankings.length})
            </button>
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
