
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Award } from "lucide-react";

interface ProgressTrackerProps {
  completionPercentage: number;
  battlesCompleted: number;
  getBattlesRemaining: () => number;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  completionPercentage,
  battlesCompleted,
  getBattlesRemaining
}) => {
  const isComplete = completionPercentage >= 100;
  
  // Ensure battles completed is displayed correctly
  const displayedBattles = battlesCompleted || 0; // Ensure we never display null/undefined
  
  // Calculate the next milestone (every 10 battles until 100, then every 50)
  const getNextMilestone = () => {
    if (battlesCompleted < 100) {
      return Math.ceil(battlesCompleted / 10) * 10;
    } else {
      return Math.ceil(battlesCompleted / 50) * 50;
    }
  };
  
  return (
    <Card className={`rounded-lg shadow transition-colors ${isComplete ? "bg-green-50 border-green-200" : "bg-white"}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm flex items-center">
            {isComplete && <Award className="mr-1 text-green-600" size={16} />}
            Overall Ranking Progress
          </h3>
          <span className={`text-xs ${isComplete ? "text-green-600 font-semibold" : "text-gray-500"}`}>
            {completionPercentage}% Complete
          </span>
        </div>
        <Progress value={completionPercentage} className={`h-2 ${isComplete ? "bg-green-100" : ""}`} />
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>Battles: {displayedBattles}</span>
          <span>
            {completionPercentage < 100 
              ? `~${getBattlesRemaining()} more needed` 
              : <span className="flex items-center text-green-600 font-semibold"><CheckCircle size={14} className="mr-1" /> Complete ranking!</span>
            }
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
