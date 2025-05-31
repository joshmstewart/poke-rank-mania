
import React from "react";
import { Pokemon, TopNOption, RankedPokemon } from "@/services/pokemon";
import RankingDisplayContainer from "./RankingDisplayContainer";

interface BattleContentMilestoneProps {
  finalRankings: Pokemon[] | RankedPokemon[];
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
  handleManualReorder,
  pendingRefinements,
  onRankingsUpdate
}) => {
  console.log(`🏆 [MILESTONE_COMPONENT_UX_FIX] ===== BattleContentMilestone RENDER =====`);
  console.log(`🏆 [MILESTONE_COMPONENT_UX_FIX] Props received:`);
  console.log(`🏆 [MILESTONE_COMPONENT_UX_FIX] - finalRankings type: ${Array.isArray(finalRankings) ? 'array' : typeof finalRankings}`);
  console.log(`🏆 [MILESTONE_COMPONENT_UX_FIX] - finalRankings length: ${finalRankings?.length || 0}`);
  console.log(`🏆 [MILESTONE_COMPONENT_UX_FIX] - battlesCompleted: ${battlesCompleted}`);
  console.log(`🏆 [MILESTONE_COMPONENT_UX_FIX] - rankingGenerated: ${rankingGenerated}`);
  console.log(`🏆 [MILESTONE_COMPONENT_UX_FIX] - activeTier: ${activeTier}`);
  console.log(`🏆 [MILESTONE_COMPONENT_UX_FIX] - onRankingsUpdate available: ${!!onRankingsUpdate}`);

  if (finalRankings && finalRankings.length > 0) {
    console.log(`🏆 [MILESTONE_COMPONENT_UX_FIX] Sample rankings:`, finalRankings.slice(0, 5).map(p => `${p.name} (${p.id})`));
    
    // Check for name formatting issues
    finalRankings.slice(0, 10).forEach((pokemon, index) => {
      console.log(`🏆 [MILESTONE_NAME_CHECK] Pokemon #${index + 1}: "${pokemon.name}" (ID: ${pokemon.id})`);
      if (pokemon.name.includes('-') && !pokemon.name.includes('(') && !pokemon.name.includes('Mega ') && !pokemon.name.includes('Alolan ') && !pokemon.name.includes('G-Max ')) {
        console.log(`🚨 [MILESTONE_NAME_CHECK] Potentially unformatted name detected: "${pokemon.name}"`);
      }
    });
  } else {
    console.log(`🚨 [MILESTONE_COMPONENT_UX_FIX] WARNING: finalRankings is empty or undefined!`);
    console.log(`🚨 [MILESTONE_COMPONENT_UX_FIX] This is likely why no Pokemon are showing at the milestone`);
    console.log(`🚨 [MILESTONE_COMPONENT_UX_FIX] Raw finalRankings value:`, finalRankings);
  }
  
  console.log(`🏆 [MILESTONE_COMPONENT_UX_FIX] ===== END PROPS LOGGING =====`);

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Milestone Reached!</h2>
      <p className="mb-4">
        Congratulations! You've completed {battlesCompleted} battles.
      </p>

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
          <p>The ranking system hasn't generated Pokemon data yet. This could mean:</p>
          <ul className="list-disc list-inside mt-2">
            <li>The TrueSkill ranking system hasn't processed the battle results</li>
            <li>There's an issue with the ranking calculation</li>
            <li>The data isn't being passed correctly to this component</li>
          </ul>
          <p className="mt-2">
            <strong>Debug info:</strong> finalRankings length = {finalRankings?.length || 0}
          </p>
        </div>
      )}
    </div>
  );
};

export default BattleContentMilestone;
