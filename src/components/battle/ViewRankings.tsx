import React from "react";
import { RankedPokemon, TopNOption } from "@/services/pokemon";
import { RankingTable } from "@/components/ranking/RankingTable";
import { TierSelector } from "./TierSelector";

interface ViewRankingsProps {
  rankings: RankedPokemon[];
  activeTier?: TopNOption;
  onSetActiveTier?: (tier: TopNOption) => void;
  onSuggestRanking?: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion?: (pokemonId: number) => void;
}

const ViewRankings: React.FC<ViewRankingsProps> = ({
  rankings,
  activeTier = 25,
  onSetActiveTier,
  onSuggestRanking,
  onRemoveSuggestion
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Current Rankings</h2>
        {onSetActiveTier && (
          <TierSelector
            activeTier={activeTier}
            onTierChange={onSetActiveTier}
          />
        )}
      </div>
      
      <RankingTable 
        displayRankings={rankings} 
        activeTier={activeTier}
        onSuggestRanking={onSuggestRanking}
        onRemoveSuggestion={onRemoveSuggestion}
      />
    </div>
  );
};

export default ViewRankings;
