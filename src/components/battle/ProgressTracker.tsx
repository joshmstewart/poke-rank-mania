
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle } from "lucide-react";

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
  return (
    <Card className="bg-white rounded-lg shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Overall Ranking Progress</h3>
          <span className="text-sm text-gray-500">
            {completionPercentage}% Complete
          </span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>Battles completed: {battlesCompleted}</span>
          <span>
            {completionPercentage < 100 
              ? `~${getBattlesRemaining()} more battles needed` 
              : <span className="flex items-center text-green-600"><CheckCircle size={16} className="mr-1" /> Complete ranking achieved!</span>
            }
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
