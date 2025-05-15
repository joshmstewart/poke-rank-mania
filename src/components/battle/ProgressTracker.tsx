
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
  
  return (
    <Card className={`rounded-lg shadow transition-colors ${isComplete ? "bg-green-50 border-green-200" : "bg-white"}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center">
            {isComplete && <Award className="mr-2 text-green-600" size={18} />}
            Overall Ranking Progress
          </h3>
          <span className={`text-sm ${isComplete ? "text-green-600 font-semibold" : "text-gray-500"}`}>
            {completionPercentage}% Complete
          </span>
        </div>
        <Progress value={completionPercentage} className={`h-2 ${isComplete ? "bg-green-100" : ""}`} />
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>Battles completed: {battlesCompleted}</span>
          <span>
            {completionPercentage < 100 
              ? `~${getBattlesRemaining()} more battles needed` 
              : <span className="flex items-center text-green-600 font-semibold"><CheckCircle size={16} className="mr-1" /> Complete ranking achieved!</span>
            }
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
