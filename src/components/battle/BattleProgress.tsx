
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";

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
  const nextMilestone = getNextMilestone();
  const progressPercentage = getMilestoneProgress();
  const battlesUntilMilestone = nextMilestone - battlesCompleted;
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            Next Milestone: {nextMilestone}
          </span>
        </div>
        <span className="text-sm text-blue-600 font-medium">
          {battlesUntilMilestone} battles away
        </span>
      </div>
      
      {/* Progress bar visualization */}
      <div className="space-y-2">
        <Progress 
          value={progressPercentage} 
          className="h-2 bg-blue-100"
        />
        <div className="flex justify-between text-xs text-blue-600">
          <span>{battlesCompleted} completed</span>
          <span>{Math.round(progressPercentage)}% to milestone</span>
        </div>
      </div>
    </div>
  );
};

export default BattleProgress;
