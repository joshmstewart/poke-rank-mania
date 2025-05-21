
import React from "react";
import { TopNOption, RankedPokemon } from "@/services/pokemon";
import { RankingHeader } from "./RankingHeader";
import { RankingInfoPanel } from "./RankingInfoPanel";
import { RankingTable } from "./RankingTable";
import { JustMissedTable } from "./JustMissedTable";

interface RankingResultsProps {
  confidentRankedPokemon: RankedPokemon[];
  confidenceScores: Record<number, number>;
  activeTier?: TopNOption;
  onTierChange?: (tier: TopNOption) => void;
}

export const RankingResults: React.FC<RankingResultsProps> = ({
  confidentRankedPokemon,
  confidenceScores, // Kept for backward compatibility
  activeTier = "All",
  onTierChange
}) => {
  // Filter rankings based on active tier
  const displayRankings = activeTier === "All" 
    ? confidentRankedPokemon
    : confidentRankedPokemon.slice(0, Number(activeTier));
  
  // Calculate just missed cutoff - top 10 outside the current tier
  const justMissedCutoff = activeTier !== "All" 
    ? confidentRankedPokemon.slice(Number(activeTier), Number(activeTier) + 10)
    : [];
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <RankingHeader 
        activeTier={activeTier} 
        onTierChange={onTierChange}
      />
      
      <RankingInfoPanel />
      
      <RankingTable 
        displayRankings={displayRankings} 
        activeTier={activeTier} 
      />
      
      <JustMissedTable 
        justMissedCutoff={justMissedCutoff} 
        activeTier={activeTier} 
      />
    </div>
  );
};
