
import React from "react";
import { BattleType } from "@/hooks/battle/types";
import BattleControlsDropdowns from "./BattleControlsDropdowns";

interface BattleControlsProps {
  selectedGeneration: number;
  battleType: BattleType;
  onGenerationChange: (generation: string) => void;
  onBattleTypeChange: (type: BattleType) => void;
  onReset: () => void;
  battleHistory: any[];
}

const BattleControls: React.FC<BattleControlsProps> = ({
  selectedGeneration,
  battleType,
  onGenerationChange,
  onBattleTypeChange,
  onReset,
  battleHistory
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <BattleControlsDropdowns
          selectedGeneration={selectedGeneration}
          battleType={battleType}
          onGenerationChange={onGenerationChange}
          onBattleTypeChange={onBattleTypeChange}
        />
        
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleControls;
