
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
      <div className="h-1 w-full bg-gray-200 rounded-full mt-2">
        <div 
          className="h-1 bg-primary rounded-full transition-all duration-500" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs mt-1 text-gray-500">
        <div>Battle: {battlesCompleted + 1}</div>
        <div>
          Next milestone: <span className="font-medium">{battlesUntilNextMilestone}</span> battles away
        </div>
      </div>
    </div>
  );
};

export default BattleProgress;
