
import React, { useState, useEffect } from "react";
import { Pokemon, TopNOption, RankedPokemon } from "@/services/pokemon";
import PokemonThumbnail from "./PokemonThumbnail";
import RankingHeader from "./RankingHeader";
import ShowMoreButton from "./ShowMoreButton";
import ViewRankings from "./ViewRankings";

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
  
  // FIXED: Ensured all hooks are called unconditionally first
  // Handle the case where we're displaying milestone view with ranked pokemon
  const hasRankedPokemon = finalRankings.length > 0 && 'score' in finalRankings[0];
  
  // Add debugging to show Pokemon with their types - this must be called unconditionally
  useEffect(() => {
    const displayRankings = finalRankings.slice(0, displayCount);
    console.log("Pokemon list with types:");
    if (displayRankings.length > 0) {
      displayRankings.slice(0, Math.min(5, displayRankings.length)).forEach((pokemon, index) => {
        console.log(`${index + 1}. ${pokemon.name} (ID: ${pokemon.id}) - Types: ${pokemon.types?.join(', ') || 'unknown'}`);
      });
    }
  }, [finalRankings, displayCount]);
  
  // Handler for the "Show More" button
  const handleShowMore = () => {
    // Increase by a larger number to display more Pokémon at once
    const increment = 50;
    const newCount = Math.min(displayCount + increment, finalRankings.length);
    console.log(`Increasing display count from ${displayCount} to ${newCount} of ${finalRankings.length} total`);
    setDisplayCount(newCount);
  };

  // Now we can conditionally render different UI based on props
  if (isMilestoneView && hasRankedPokemon) {
    return (
      <ViewRankings 
        rankings={finalRankings as RankedPokemon[]}
        activeTier={activeTier}
        onSetActiveTier={onTierChange}
        onSuggestRanking={onSuggestRanking}
        onRemoveSuggestion={onRemoveSuggestion}
        isMilestoneView={isMilestoneView}
        battlesCompleted={battlesCompleted}
        onContinueBattles={onContinueBattles}
        onNewBattleSet={onNewBattleSet}
        rankingGenerated={rankingGenerated}
        onSaveRankings={onSaveRankings}
      />
    );
  }
  
  // Take the top rankings to display
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {displayRankings.map((pokemon, index) => (
          <PokemonThumbnail 
            key={pokemon.id} 
            pokemon={pokemon} 
            index={index} 
            onSuggestRanking={onSuggestRanking && isRankedPokemon(pokemon) ? onSuggestRanking : undefined}
            onRemoveSuggestion={onRemoveSuggestion}
          />
        ))}
      </div>
      
      <ShowMoreButton 
        displayCount={displayCount} 
        totalCount={finalRankings.length} 
        onShowMore={handleShowMore} 
      />
    </div>
  );
};

// Type guard to check if a pokemon is a RankedPokemon
const isRankedPokemon = (pokemon: Pokemon): pokemon is RankedPokemon => {
  return 'score' in pokemon && 'count' in pokemon;
};

export default RankingDisplay;
