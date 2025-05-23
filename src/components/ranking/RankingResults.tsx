
import React, { useState } from 'react';
import { RankedPokemon, TopNOption } from "@/services/pokemon";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import TierSelector from "@/components/battle/TierSelector";
import { RankingGrid } from "./RankingGrid";

interface RankingResultsProps {
  confidentRankedPokemon: RankedPokemon[];
  confidenceScores: Record<number, number>;
  activeTier?: TopNOption;
  onTierChange?: (tier: TopNOption) => void;
  onSuggestRanking?: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion?: (pokemonId: number) => void;
  onClearSuggestions?: () => void;
}

export const RankingResults: React.FC<RankingResultsProps> = ({
  confidentRankedPokemon,
  confidenceScores,
  activeTier = 25,
  onTierChange,
  onSuggestRanking,
  onRemoveSuggestion,
  onClearSuggestions
}) => {
  const [currentTier, setCurrentTier] = useState<TopNOption>(activeTier);
  
  const handleTierChange = (tier: TopNOption) => {
    setCurrentTier(tier);
    if (onTierChange) {
      onTierChange(tier);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ranking Results</h2>
        <div className="flex items-center gap-2">
          {onClearSuggestions && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClearSuggestions}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> 
              Clear Suggestions
            </Button>
          )}
          {onTierChange && (
            <TierSelector 
              activeTier={currentTier} 
              onTierChange={handleTierChange} 
            />
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <RankingGrid 
          displayRankings={confidentRankedPokemon} 
          activeTier={currentTier}
          onSuggestRanking={onSuggestRanking}
          onRemoveSuggestion={onRemoveSuggestion}
        />
      </div>
    </div>
  );
};
