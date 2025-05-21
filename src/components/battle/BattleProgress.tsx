
import React from "react";

interface BattleProgressProps {
  battlesCompleted: number;
  getMilestoneProgress: () => number;
  getNextMilestone: () => number;
}

const BattleProgress: React.FC<BattleProgressProps> = ({
  battlesCompleted,
  getMilestoneProgress,
  getNextMilestone
}) => {
  // Calculate battles remaining until next milestone
  const battlesUntilNextMilestone = getNextMilestone() - battlesCompleted;
  const progressPercentage = getMilestoneProgress();
  
  return (
    <div>
      <div className="h-1.5 w-full bg-gray-200 rounded-full mt-2 overflow-hidden">
        <div 
          className="h-1.5 bg-primary rounded-full transition-all duration-500 relative"
          style={{ width: `${progressPercentage}%` }}
        >
          {progressPercentage > 30 && (
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          )}
        </div>
      </div>
      <div className="flex justify-between text-xs mt-1 text-gray-500">
        <div>Battle: {battlesCompleted + 1}</div>
        <div>
          Next milestone: <span className="font-medium text-primary">{battlesUntilNextMilestone}</span> battles away
        </div>
      </div>
    </div>
  );
};

export default BattleProgress;
