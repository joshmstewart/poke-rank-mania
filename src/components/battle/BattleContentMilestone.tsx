import React, { useState, useEffect } from "react";
import { Pokemon, TopNOption, RankedPokemon } from "@/services/pokemon";
import RankingDisplayContainer from "./RankingDisplayContainer";
import { useBattleRankings } from "@/hooks/battle/useBattleRankings";

interface BattleContentMilestoneProps {
  battlesCompleted: number;
  rankingGenerated: boolean;
  activeTier: TopNOption;
  getSnapshotForMilestone: () => string;
  onContinueBattles: () => void;
  performFullBattleReset: () => void;
  handleSaveRankings: () => void;
  setActiveTier: (tier: TopNOption) => void;
  suggestRanking?: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  removeSuggestion?: (pokemonId: number) => void;
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>;
  resetMilestoneInProgress: () => void;
  handleManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  pendingRefinements?: Set<number>;
  onRankingsUpdate: (updatedRankings: RankedPokemon[]) => void;
}

const BattleContentMilestone: React.FC<BattleContentMilestoneProps> = ({
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
  handleManualReorder,
  pendingRefinements,
  onRankingsUpdate
}) => {
  console.log(`🏆 [MILESTONE_COMPONENT_TRUESKILL_SYNC] ===== BattleContentMilestone RENDER =====`);

  // Fetch rankings directly from the source of truth to avoid stale props
  const { generateRankingsFromStore } = useBattleRankings();
  const [finalRankings, setFinalRankings] = useState<RankedPokemon[]>([]);

  useEffect(() => {
    if (rankingGenerated) {
      console.log('🏆 [MILESTONE_COMPONENT_TRUESKILL_SYNC] `rankingGenerated` is true. Fetching fresh rankings from TrueSkill store.');
      const freshRankings = generateRankingsFromStore();
      setFinalRankings(freshRankings);
      console.log(`🏆 [MILESTONE_COMPONENT_TRUESKILL_SYNC] Fetched ${freshRankings.length} rankings.`);
    }
  }, [rankingGenerated, generateRankingsFromStore]);
  
  console.log(`🏆 [MILESTONE_COMPONENT_TRUESKILL_SYNC] finalRankings length: ${finalRankings?.length || 0}`);
  console.log(`🏆 [MILESTONE_COMPONENT_TRUESKILL_SYNC] battlesCompleted: ${battlesCompleted}`);
  console.log(`🏆 [MILESTONE_COMPONENT_TRUESKILL_SYNC] rankingGenerated: ${rankingGenerated}`);

  if (finalRankings && finalRankings.length > 0) {
    console.log(`🏆 [MILESTONE_COMPONENT_TRUESKILL_SYNC] Sample rankings:`, finalRankings.slice(0, 5).map(p => {
      const score = 'score' in p && typeof p.score === 'number' ? p.score.toFixed(3) : 'N/A';
      return `${p.name} (${p.id}) - Score: ${score}`;
    }));
    console.log(`🏆 [MILESTONE_COMPONENT_TRUESKILL_SYNC] Rankings now using TrueSkill store data (same as Manual mode)`);
  } else {
    console.log(`🚨 [MILESTONE_COMPONENT_TRUESKILL_SYNC] WARNING: finalRankings is empty or undefined!`);
    console.log(`🚨 [MILESTONE_COMPONENT_TRUESKILL_SYNC] This could indicate TrueSkill store sync issue`);
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Milestone Reached!</h2>
      <p className="mb-4">
        Congratulations! You've completed {battlesCompleted} battles.
      </p>
      
      {/* Rankings info box removed as requested. */}

      {finalRankings && finalRankings.length > 0 ? (
        <RankingDisplayContainer
          finalRankings={finalRankings}
          battlesCompleted={battlesCompleted}
          onContinueBattles={onContinueBattles}
          onNewBattleSet={() => {
            setShowingMilestone(false);
            resetMilestoneInProgress();
          }}
          rankingGenerated={rankingGenerated}
          onSaveRankings={handleSaveRankings}
          isMilestoneView={true}
          activeTier={activeTier}
          onManualReorder={handleManualReorder}
          pendingRefinements={pendingRefinements}
          enableDragAndDrop={true}
        />
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold">⚠️ No Pokemon Rankings Available</h3>
          <p>The TrueSkill ranking system hasn't generated Pokemon data yet. This could mean:</p>
          <ul className="list-disc list-inside mt-2">
            <li>No battles have been completed in this session</li>
            <li>TrueSkill store is not properly populated</li>
            <li>Rankings generation is not using the centralized store</li>
          </ul>
          <p className="mt-2">
            <strong>Debug info:</strong> finalRankings length = {finalRankings?.length || 0}, rankingGenerated = {rankingGenerated}
          </p>
        </div>
      )}
    </div>
  );
};

export default BattleContentMilestone;
