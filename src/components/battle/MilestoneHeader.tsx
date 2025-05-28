
import React from "react";
import { Button } from "@/components/ui/button";
import { TopNOption } from "@/services/pokemon";

interface MilestoneHeaderProps {
  battlesCompleted: number;
  displayCount: number;
  activeTier: TopNOption;
  maxItems: number;
  pendingRefinementsCount: number;
  onContinueBattles: () => void;
}

const MilestoneHeader: React.FC<MilestoneHeaderProps> = ({
  battlesCompleted,
  displayCount,
  activeTier,
  maxItems,
  pendingRefinementsCount,
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
        {pendingRefinementsCount > 0 && (
          <span className="text-yellow-600 text-sm font-medium">
            • {pendingRefinementsCount} pending validation{pendingRefinementsCount > 1 ? 's' : ''}
          </span>
        )}
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
