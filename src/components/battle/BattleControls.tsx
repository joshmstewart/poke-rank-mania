
import React from "react";
import { BattleType } from "@/hooks/battle/types";
import { SingleBattle } from "@/hooks/battle/types";
import UnifiedControls from "../shared/UnifiedControls";

interface BattleControlsProps {
  selectedGeneration: number;
  battleType: BattleType;
  onGenerationChange: (generation: string) => void;
  onBattleTypeChange: (type: BattleType) => void;
  onRestartBattles: () => void;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
  performFullBattleReset?: () => void;
}

const BattleControls: React.FC<BattleControlsProps> = ({
  selectedGeneration,
  battleType,
  onGenerationChange,
  onBattleTypeChange,
  onRestartBattles,
  setBattlesCompleted,
  setBattleResults,
  performFullBattleReset
}) => {
  const handleBattleModeReset = () => {
    console.log(`🔄 [BATTLE_MODE_RESET] Performing Battle mode specific reset actions`);
    
    // Reset React state
    if (setBattlesCompleted) setBattlesCompleted(0);
    if (setBattleResults) setBattleResults([]);
    
    // Use the centralized reset if available
    if (performFullBattleReset) {
      // Don't call it here since UnifiedControls will handle the TrueSkill clearing
      // Just do the Battle mode specific cleanup
      onRestartBattles();
    } else {
      onRestartBattles();
    }
  };

  return (
    <UnifiedControls
      selectedGeneration={selectedGeneration}
      battleType={battleType}
      onGenerationChange={onGenerationChange}
      onBattleTypeChange={onBattleTypeChange}
      showBattleTypeControls={true}
      mode="battle"
      onReset={onRestartBattles}
      customResetAction={handleBattleModeReset}
    />
  );
};

export default BattleControls;
