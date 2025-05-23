
import React from "react";
import { RankedPokemon, TopNOption } from "@/services/pokemon";
import TierSelector from "./TierSelector";
import RankingHeader from "./RankingHeader";
import { RankingGrid } from "../ranking/RankingGrid";

interface ViewRankingsProps {
  rankings: RankedPokemon[];
  activeTier?: TopNOption;
  onSetActiveTier?: (tier: TopNOption) => void;
  onSuggestRanking?: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion?: (pokemonId: number) => void;
  // Milestone view props
  isMilestoneView?: boolean;
  battlesCompleted?: number;
  onContinueBattles?: () => void;
  onNewBattleSet?: () => void;
  rankingGenerated?: boolean;
  onSaveRankings?: () => void;
}

const ViewRankings: React.FC<ViewRankingsProps> = ({
  rankings,
  activeTier = 25,
  onSetActiveTier,
  onSuggestRanking,
  onRemoveSuggestion,
  // Milestone view props
  isMilestoneView = false,
  battlesCompleted = 0,
  onContinueBattles,
  onNewBattleSet,
  rankingGenerated,
  onSaveRankings
}) => {
  // If we're in milestone view and have the required props, show the milestone header
  if (isMilestoneView && onContinueBattles && rankingGenerated !== undefined) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <RankingHeader 
          title="Current Rankings"
          displayCount={rankings.length}
          totalCount={rankings.length}
          isMilestoneView={isMilestoneView}
          battlesCompleted={battlesCompleted}
          rankingGenerated={rankingGenerated}
          onContinueBattles={onContinueBattles}
          onNewBattleSet={onNewBattleSet || (() => {})}
          onSaveRankings={onSaveRankings || (() => {})}
        />
        
        <RankingGrid 
          displayRankings={rankings} 
          activeTier={activeTier}
          isMilestoneView={isMilestoneView}
          battlesCompleted={battlesCompleted}
          onSuggestRanking={onSuggestRanking}
          onRemoveSuggestion={onRemoveSuggestion}
        />
      </div>
    );
  }

  // Default view (non-milestone)
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
      
      <RankingGrid 
        displayRankings={rankings} 
        activeTier={activeTier}
        onSuggestRanking={onSuggestRanking}
        onRemoveSuggestion={onRemoveSuggestion}
      />
    </div>
  );
};

export default ViewRankings;
