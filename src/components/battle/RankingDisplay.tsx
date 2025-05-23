
import React, { useState, useEffect } from "react";
import { Pokemon, TopNOption, RankedPokemon } from "@/services/pokemon";
import PokemonThumbnail from "./PokemonThumbnail";
import RankingHeader from "./RankingHeader";
import ShowMoreButton from "./ShowMoreButton";
import ViewRankings from "./ViewRankings";
import { RankingGrid } from "../ranking/RankingGrid";

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

  // New condition to use the grid view
  if (isMilestoneView && hasRankedPokemon) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <RankingGrid 
          displayRankings={finalRankings as RankedPokemon[]}
          activeTier={activeTier}
          isMilestoneView={isMilestoneView}
          battlesCompleted={battlesCompleted}
          totalCount={finalRankings.length}
          displayCount={finalRankings.length}
          onSuggestRanking={onSuggestRanking}
          onRemoveSuggestion={onRemoveSuggestion}
          onContinueBattles={onContinueBattles}
        />
      </div>
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

      <RankingGrid
        displayRankings={displayRankings as RankedPokemon[]}
        activeTier={activeTier}
        totalCount={finalRankings.length}
        displayCount={displayCount}
        onShowMore={handleShowMore}
        onSuggestRanking={onSuggestRanking && hasRankedPokemon ? onSuggestRanking : undefined}
        onRemoveSuggestion={onRemoveSuggestion}
      />
    </div>
  );
};

// Type guard to check if a pokemon is a RankedPokemon
const isRankedPokemon = (pokemon: Pokemon): pokemon is RankedPokemon => {
  return 'score' in pokemon && 'count' in pokemon;
};

export default RankingDisplay;
