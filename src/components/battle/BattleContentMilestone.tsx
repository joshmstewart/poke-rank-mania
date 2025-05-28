
import React from "react";
import RankingDisplay from "./RankingDisplay";
import { RankedPokemon, TopNOption } from "@/services/pokemon";

interface BattleContentMilestoneProps {
  finalRankings: RankedPokemon[];
  battlesCompleted: number;
  rankingGenerated: boolean;
  activeTier: TopNOption;
  getSnapshotForMilestone: (battles: number) => RankedPokemon[];
  onContinueBattles: () => void;
  performFullBattleReset: () => void;
  handleSaveRankings: () => void;
  setActiveTier: (tier: TopNOption) => void;
  suggestRanking: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  removeSuggestion: (pokemonId: number) => void;
  setShowingMilestone: (show: boolean) => void;
  resetMilestoneInProgress: () => void;
  handleContinueBattles: () => void;
}

const BattleContentMilestone: React.FC<BattleContentMilestoneProps> = ({
  finalRankings,
  battlesCompleted,
  rankingGenerated,
  activeTier,
  getSnapshotForMilestone,
  onContinueBattles,
  performFullBattleReset,
  handleSaveRankings,
  setActiveTier,
  suggestRanking,
  removeSuggestion,
  setShowingMilestone,
  resetMilestoneInProgress,
  handleContinueBattles
}) => {
  console.log(`🏆 [FINAL_FIX] DISPLAYING MILESTONE RANKINGS SCREEN for ${battlesCompleted} battles`);
  
  const milestoneSnapshot = getSnapshotForMilestone(battlesCompleted);
  const rankingsToShow = milestoneSnapshot.length > 0 ? milestoneSnapshot : finalRankings;
  
  return (
    <RankingDisplay
      finalRankings={rankingsToShow}
      battlesCompleted={battlesCompleted}
      onContinueBattles={() => {
        console.log(`🔄 [FINAL_FIX] Continue battles clicked from milestone screen`);
        setShowingMilestone(false);
        resetMilestoneInProgress();
        setTimeout(() => {
          handleContinueBattles();
        }, 300);
      }}
      onNewBattleSet={performFullBattleReset}
      rankingGenerated={rankingGenerated}
      onSaveRankings={handleSaveRankings}
      isMilestoneView={true}
      activeTier={activeTier}
      onTierChange={setActiveTier}
      onSuggestRanking={suggestRanking}
      onRemoveSuggestion={removeSuggestion}
    />
  );
};

export default BattleContentMilestone;
