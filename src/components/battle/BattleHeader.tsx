
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

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
  // Only show back button if there's history to go back to
  const showBackButton = hasHistory && battlesCompleted > 0;
  
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        {showBackButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={onGoBack}
            disabled={isProcessing || internalProcessing}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
        <span className="text-sm text-muted-foreground">
          Battles completed: {battlesCompleted}
        </span>
      </div>
    </div>
  );
};

export default BattleHeader;
