
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
  // Ensure we have valid values by using defaults if needed
  const safeCompletionPercentage = isNaN(completionPercentage) ? 0 : completionPercentage;
  const safeBattlesCompleted = isNaN(battlesCompleted) ? 0 : battlesCompleted;
  const isComplete = safeCompletionPercentage >= 100;
  
  // Calculate the next milestone (every 10 battles until 100, then every 50)
  const getNextMilestone = () => {
    if (safeBattlesCompleted < 10) {
      return 10;
    } else if (safeBattlesCompleted < 25) {
      return 25;
    } else if (safeBattlesCompleted < 50) {
      return 50;
    } else if (safeBattlesCompleted < 100) {
      return 100;
    } else {
      return Math.ceil(safeBattlesCompleted / 50) * 50 + 50;
    }
  };
  
  // Safely get battles remaining
  const battlesRemaining = (() => {
    try {
      return getBattlesRemaining();
    } catch (e) {
      console.error("Error getting battles remaining:", e);
      return 0;
    }
  })();
  
  console.log(`ProgressTracker: Battles completed: ${safeBattlesCompleted}, Completion: ${safeCompletionPercentage}%, Remaining: ${battlesRemaining}`);
  
  return (
    <Card className={`rounded-lg shadow transition-colors ${isComplete ? "bg-green-50 border-green-200" : "bg-white"}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm flex items-center">
            {isComplete && <Award className="mr-1 text-green-600" size={16} />}
            Overall Ranking Progress
          </h3>
          <span className={`text-xs ${isComplete ? "text-green-600 font-semibold" : "text-gray-500"}`}>
            {safeCompletionPercentage}% Complete
          </span>
        </div>
        <Progress value={safeCompletionPercentage} className={`h-2 ${isComplete ? "bg-green-100" : ""}`} />
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>Battles: {safeBattlesCompleted}</span>
          <span>
            {safeCompletionPercentage < 100 
              ? `Next milestone: ${getNextMilestone()} battles` 
              : <span className="flex items-center text-green-600 font-semibold"><CheckCircle size={14} className="mr-1" /> Complete ranking!</span>
            }
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
