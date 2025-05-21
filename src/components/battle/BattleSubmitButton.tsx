
import React from "react";
import { Button } from "@/components/ui/button";

interface BattleSubmitButtonProps {
  onSubmit: () => void;
  isProcessing: boolean;
  internalProcessing: boolean;
  hasSelections: boolean;
}

const BattleSubmitButton: React.FC<BattleSubmitButtonProps> = ({
  onSubmit,
  isProcessing,
  internalProcessing,
  hasSelections
}) => {
  return (
    <div className="mt-8 flex justify-center">
      <Button 
        size="lg" 
        onClick={onSubmit}
        className="px-8"
        disabled={isProcessing || internalProcessing || !hasSelections}
      >
        {(isProcessing || internalProcessing) ? (
          <>
            <span className="mr-2 animate-spin">⏳</span>
            Processing...
          </>
        ) : (
          'Submit Your Choices'
        )}
      </Button>
    </div>
  );
};

export default BattleSubmitButton;
