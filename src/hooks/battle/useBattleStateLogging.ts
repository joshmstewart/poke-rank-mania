
import { useEffect } from "react";
import { RankedPokemon } from "@/services/pokemon";

interface LoggingHookProps {
  battlesCompleted: number;
  milestones: number[];
  showingMilestone: boolean;
  rankingGenerated: boolean;
  finalRankings: RankedPokemon[];
  battleHistory: { battle: any[], selected: number[] }[];
}

export const useBattleStateLogging = ({
  battlesCompleted,
  milestones,
  showingMilestone,
  rankingGenerated,
  finalRankings,
  battleHistory
}: LoggingHookProps) => {
  
  // Track state changes with detailed logging
  useEffect(() => {
    console.log(`🚨🚨🚨 [STATE_CHANGE_MEGA_DEBUG] battlesCompleted changed to: ${battlesCompleted}`);
    console.log(`🚨🚨🚨 [STATE_CHANGE_MEGA_DEBUG] Available milestones: ${milestones.join(', ')}`);
    console.log(`🚨🚨🚨 [STATE_CHANGE_MEGA_DEBUG] Is ${battlesCompleted} in milestones? ${milestones.includes(battlesCompleted)}`);
  }, [battlesCompleted, milestones]);

  useEffect(() => {
    console.log(`🚨🚨🚨 [STATE_CHANGE_MEGA_DEBUG] showingMilestone changed to: ${showingMilestone}`);
  }, [showingMilestone]);

  useEffect(() => {
    console.log(`🚨🚨🚨 [STATE_CHANGE_MEGA_DEBUG] rankingGenerated changed to: ${rankingGenerated}`);
  }, [rankingGenerated]);

  useEffect(() => {
    console.log(`🚨🚨🚨 [STATE_CHANGE_MEGA_DEBUG] finalRankings changed - length: ${finalRankings.length}`);
    if (finalRankings.length > 0) {
      console.log(`🚨🚨🚨 [STATE_CHANGE_MEGA_DEBUG] Top 3 rankings:`, finalRankings.slice(0, 3).map(p => `${p.name} (${p.id}) - score: ${p.score?.toFixed(1) || 'no score'}`));
    }
  }, [finalRankings]);

  useEffect(() => {
    console.log(`🚨🚨🚨 [STATE_CHANGE_MEGA_DEBUG] battleHistory changed - length: ${battleHistory.length}`);
    if (battleHistory.length > 0) {
      const lastBattle = battleHistory[battleHistory.length - 1];
      console.log(`🚨🚨🚨 [STATE_CHANGE_MEGA_DEBUG] Latest battle: ${lastBattle.battle.map(p => p.name).join(' vs ')} -> selected: [${lastBattle.selected.join(', ')}]`);
    }
  }, [battleHistory]);

  useEffect(() => {
    console.log(`🚨🚨🚨 [STATE_DEBUG] showingMilestone effect triggered - value: ${showingMilestone}`);
    if (showingMilestone) {
      console.log(`🚨🚨🚨 [STATE_DEBUG] Milestone is showing - finalRankings length: ${finalRankings.length}`);
      if (finalRankings.length > 0) {
        console.log(`🚨🚨🚨 [STATE_DEBUG] Sample rankings:`, finalRankings.slice(0, 3).map(p => `${p.name} (${p.id})`));
      } else {
        console.log(`🚨🚨🚨 [STATE_DEBUG] ❌ CRITICAL: finalRankings is EMPTY when milestone is showing!`);
      }
    }
  }, [showingMilestone, finalRankings]);

  useEffect(() => {
    console.log(`🚨🚨🚨 [STATE_DEBUG] finalRankings effect triggered - length: ${finalRankings.length}`);
    if (finalRankings.length > 0) {
      console.log(`🚨🚨🚨 [STATE_DEBUG] Top 5 rankings:`, finalRankings.slice(0, 5).map(p => `${p.name} (${p.id}) - score: ${p.score?.toFixed(1) || 'no score'}`));
    }
  }, [finalRankings]);

  useEffect(() => {
    console.log(`🚨🚨🚨 [STATE_DEBUG] battlesCompleted effect triggered - value: ${battlesCompleted}`);
  }, [battlesCompleted]);
};
