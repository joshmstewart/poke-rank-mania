
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BattleHeaderProps {
  battlesCompleted: number;
  onGoBack: () => void;
  hasHistory: boolean;
  isProcessing: boolean;
  internalProcessing: boolean;
}

const BattleHeader: React.FC<BattleHeaderProps> = ({
  battlesCompleted,
  onGoBack,
  hasHistory,
  isProcessing,
  internalProcessing
}) => {
  const currentBattle = battlesCompleted + 1;
  const combinedProcessing = isProcessing || internalProcessing;

  return (
    <div className="flex items-center justify-between mb-2">
      {/* Left side - Current battle info - more compact */}
      <div className="flex items-center gap-4">
        <div className="text-xl font-bold text-gray-800">
          Battle {currentBattle}
        </div>
        <div className="text-sm text-gray-600">
          Completed: {battlesCompleted}
        </div>
      </div>

      {/* Right side - Back button */}
      <div className="flex items-center">
        {hasHistory && (
          <Button 
            onClick={onGoBack}
            variant="outline"
            size="sm"
            disabled={combinedProcessing}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
      </div>
    </div>
  );
};

export default BattleHeader;
