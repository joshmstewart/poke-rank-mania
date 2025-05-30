
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Award, TrendingUp } from "lucide-react";

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
  // CRITICAL FIX: Local state to force immediate updates on reset
  const [localBattlesCompleted, setLocalBattlesCompleted] = useState(battlesCompleted);
  const [localCompletionPercentage, setLocalCompletionPercentage] = useState(completionPercentage);

  // Update local state when props change
  useEffect(() => {
    setLocalBattlesCompleted(battlesCompleted);
    setLocalCompletionPercentage(completionPercentage);
  }, [battlesCompleted, completionPercentage]);

  // CRITICAL FIX: Listen for reset events and immediately update display
  useEffect(() => {
    const handleBattleSystemReset = () => {
      console.log(`🔄 [PROGRESS_TRACKER_RESET] Resetting progress display to 0`);
      setLocalBattlesCompleted(0);
      setLocalCompletionPercentage(0);
    };

    document.addEventListener('battle-system-reset', handleBattleSystemReset);
    
    return () => {
      document.removeEventListener('battle-system-reset', handleBattleSystemReset);
    };
  }, []);

  // Ensure we have valid values by using defaults if needed
  const safeCompletionPercentage = isNaN(localCompletionPercentage) ? 0 : Math.min(100, localCompletionPercentage);
  const safeBattlesCompleted = isNaN(localBattlesCompleted) ? 0 : localBattlesCompleted;
  const isComplete = safeCompletionPercentage >= 100;
  const hasStarted = safeBattlesCompleted > 0;
  
  // Safely get battles remaining
  const battlesRemaining = (() => {
    try {
      return getBattlesRemaining();
    } catch (e) {
      console.error("Error getting battles remaining:", e);
      return 0;
    }
  })();
  
  return (
    <Card className={`rounded-lg shadow transition-colors ${isComplete ? "bg-green-50 border-green-200" : "bg-white"} w-full`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm flex items-center">
            {isComplete && <Award className="mr-1 text-green-600" size={16} />}
            {!isComplete && hasStarted && <TrendingUp className="mr-1 text-blue-600" size={16} />}
            {!isComplete && !hasStarted && <TrendingUp className="mr-1 text-gray-500" size={16} />}
            Overall Ranking Progress
          </h3>
          <span className={`text-xs ${isComplete ? "text-green-600 font-semibold" : hasStarted ? "text-blue-600" : "text-gray-500"}`}>
            {safeCompletionPercentage}% Complete
          </span>
        </div>
        <Progress value={safeCompletionPercentage} className={`h-3 ${isComplete ? "bg-green-100" : ""}`} />
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>Battles completed: {safeBattlesCompleted}</span>
          {battlesRemaining > 0 && hasStarted && (
            <span className="text-blue-600">~{battlesRemaining} battles left</span>
          )}
          {safeCompletionPercentage >= 100 && (
            <span className="flex items-center text-green-600 font-semibold">
              <CheckCircle size={14} className="mr-1" /> Complete ranking!
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
