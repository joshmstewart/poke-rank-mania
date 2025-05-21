
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
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        {hasHistory && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2" 
            onClick={onGoBack}
            disabled={isProcessing || internalProcessing}
          >
            <ChevronLeft className="mr-1" /> Back
          </Button>
        )}
        <h2 className="text-2xl font-bold">Battle {battlesCompleted + 1}</h2>
      </div>
      
      {(isProcessing || internalProcessing) && (
        <div className="text-sm text-amber-600 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-amber-600 mr-2"></div>
          Processing...
        </div>
      )}
    </div>
  );
};

export default BattleHeader;
