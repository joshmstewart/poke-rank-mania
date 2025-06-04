
import React from "react";
import { Button } from "@/components/ui/button";

interface DebugControlsProps {
  onShowDebugModal: () => void;
}

export const DebugControls: React.FC<DebugControlsProps> = ({ onShowDebugModal }) => {
  return (
    <div className="flex justify-center mt-4">
      <Button 
        onClick={onShowDebugModal}
        variant="outline"
        className="bg-purple-100 border-purple-400 text-purple-800 hover:bg-purple-200"
      >
        🔍 Debug Score Adjustment
      </Button>
    </div>
  );
};
