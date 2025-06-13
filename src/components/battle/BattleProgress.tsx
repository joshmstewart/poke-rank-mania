
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";
import { getMilestoneProgress, getNextMilestone } from "@/utils/battleMilestones";

interface BattleProgressProps {
  battlesCompleted: number;
  getMilestoneProgress?: () => number; // Keep for compatibility but we'll use our own
  getNextMilestone?: () => number; // Keep for compatibility but we'll use our own
}

const BattleProgress: React.FC<BattleProgressProps> = ({
  battlesCompleted
}) => {
  const nextMilestone = getNextMilestone(battlesCompleted);
  const { progress: progressPercentage } = getMilestoneProgress(battlesCompleted);
  const battlesUntilMilestone = nextMilestone - battlesCompleted;
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            Next Milestone: {nextMilestone}
          </span>
        </div>
        <span className="text-sm text-blue-600 font-medium">
          {battlesUntilMilestone} away
        </span>
      </div>
      
      <div className="space-y-1">
        <Progress 
          value={progressPercentage} 
          className="h-1.5 bg-blue-100"
        />
        <div className="flex justify-between text-xs text-blue-600">
          <span>{battlesCompleted} completed</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
      </div>
    </div>
  );
};

export default BattleProgress;
