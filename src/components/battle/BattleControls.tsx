
import React from "react";
import { BattleType } from "@/hooks/battle/types";
import { RankingMode } from "@/components/ranking/RankingModeSelector";
import BattleControlsDropdowns from "./BattleControlsDropdowns";
import BattleHistory from "./BattleHistory";

interface BattleControlsProps {
  selectedGeneration: number;
  battleType: BattleType;
  rankingMode?: RankingMode;
  onGenerationChange: (generation: string) => void;
  onBattleTypeChange: (type: BattleType) => void;
  onRankingModeChange?: (mode: RankingMode) => void;
  onReset: () => void;
  battleHistory: any[];
}

const BattleControls: React.FC<BattleControlsProps> = ({
  selectedGeneration,
  battleType,
  rankingMode,
  onGenerationChange,
  onBattleTypeChange,
  onRankingModeChange,
  onReset,
  battleHistory
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <BattleControlsDropdowns
          selectedGeneration={selectedGeneration}
          battleType={battleType}
          rankingMode={rankingMode}
          onGenerationChange={onGenerationChange}
          onBattleTypeChange={onBattleTypeChange}
          onRankingModeChange={onRankingModeChange}
        />
        
        <BattleHistory 
          battleHistory={battleHistory}
          onReset={onReset}
        />
      </div>
    </div>
  );
};

export default BattleControls;
