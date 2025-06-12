
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
  // CRITICAL FIX: Calculate next milestone based on every 25 battles pattern
  const calculateNextMilestone = () => {
    const currentMilestone = Math.floor(battlesCompleted / 25) * 25;
    return currentMilestone + 25;
  };

  // CRITICAL FIX: Calculate progress based on every 25 battles pattern  
  const calculateMilestoneProgress = () => {
    const currentMilestone = Math.floor(battlesCompleted / 25) * 25;
    const nextMilestone = currentMilestone + 25;
    const progressInCurrentRange = battlesCompleted - currentMilestone;
    return (progressInCurrentRange / 25) * 100;
  };

  const nextMilestone = calculateNextMilestone();
  const progressPercentage = calculateMilestoneProgress();
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
      
      {/* Progress bar visualization - more compact */}
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
