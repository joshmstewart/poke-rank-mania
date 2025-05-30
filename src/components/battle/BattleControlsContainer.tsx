
import React, { useEffect } from "react";
import { BattleType } from "@/hooks/battle/types";
import { SingleBattle } from "@/hooks/battle/types";
import BattleControlsDropdowns from "./BattleControlsDropdowns";
import BattleControlsActions from "./BattleControlsActions";

interface BattleControlsContainerProps {
  selectedGeneration: number;
  battleType: BattleType;
  onGenerationChange: (generation: string) => void;
  onBattleTypeChange: (type: BattleType) => void;
  onRestartBattles: () => void;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
  performFullBattleReset?: () => void;
}

const BattleControlsContainer: React.FC<BattleControlsContainerProps> = ({
  selectedGeneration,
  battleType,
  onGenerationChange,
  onBattleTypeChange,
  onRestartBattles,
  setBattlesCompleted,
  setBattleResults,
  performFullBattleReset
}) => {
  const safeSelectedGeneration = selectedGeneration !== undefined ? selectedGeneration : 0;
  
  useEffect(() => {
    console.log("🔍 BattleControls mounted:", {
      selectedGeneration: safeSelectedGeneration,
      battleType,
      battlesCompleted: localStorage.getItem('pokemon-battle-count')
    });
  }, [safeSelectedGeneration, battleType]);

  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow border w-full">
      <div className="flex items-center">
        <BattleControlsDropdowns
          selectedGeneration={safeSelectedGeneration}
          battleType={battleType}
          onGenerationChange={onGenerationChange}
          onBattleTypeChange={onBattleTypeChange}
        />
        
        {/* Subtle vertical divider between filter settings and action settings */}
        <div className="h-8 w-px bg-gray-200 mx-6"></div>
        
        <BattleControlsActions
          selectedGeneration={safeSelectedGeneration}
          battleType={battleType}
          onGenerationChange={onGenerationChange}
          onBattleTypeChange={onBattleTypeChange}
          onRestartBattles={onRestartBattles}
          setBattlesCompleted={setBattlesCompleted}
          setBattleResults={setBattleResults}
          performFullBattleReset={performFullBattleReset}
        />
      </div>
    </div>
  );
};

export default BattleControlsContainer;
