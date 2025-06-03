
import React from "react";
import { Button } from "@/components/ui/button";
import { TopNOption } from "@/services/pokemon";
import AutoBattleLogsModal from "./AutoBattleLogsModal";

interface MilestoneHeaderProps {
  battlesCompleted: number;
  displayCount: number;
  activeTier: TopNOption;
  maxItems: number;
  onContinueBattles: () => void;
}

const MilestoneHeader: React.FC<MilestoneHeaderProps> = ({
  battlesCompleted,
  displayCount,
  activeTier,
  maxItems,
  onContinueBattles
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🏆</span>
        <h1 className="text-xl font-bold text-gray-800">
          Milestone: {battlesCompleted} Battles
        </h1>
        <span className="text-gray-500 text-sm">
          (Showing {displayCount} of {activeTier === "All" ? maxItems : Math.min(Number(activeTier), maxItems)})
        </span>
        <AutoBattleLogsModal />
      </div>
      
      <Button 
        onClick={onContinueBattles}
        className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium"
      >
        Continue Battles
      </Button>
    </div>
  );
};

export default MilestoneHeader;
