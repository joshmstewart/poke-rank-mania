
import React from "react";
import { BattleType } from "@/hooks/battle/types";
import { SingleBattle } from "@/hooks/battle/types";
import { TopNOption } from "@/services/pokemon";
import UnifiedControls from "../shared/UnifiedControls";
import TierSelector from "./TierSelector";

interface BattleControlsProps {
  selectedGeneration: number;
  battleType: BattleType;
  onGenerationChange: (generation: string) => void;
  onBattleTypeChange: (type: BattleType) => void;
  onRestartBattles: () => void;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
  performFullBattleReset?: () => void;
  activeTier?: TopNOption;
  setActiveTier?: (tier: TopNOption) => void;
}

const BattleControls: React.FC<BattleControlsProps> = ({
  selectedGeneration,
  battleType,
  onGenerationChange,
  onBattleTypeChange,
  onRestartBattles,
  setBattlesCompleted,
  setBattleResults,
  performFullBattleReset,
  activeTier = 25,
  setActiveTier
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
    <div className="flex items-center justify-between gap-4">
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
      
      {/* Add the TierSelector here */}
      {setActiveTier && (
        <TierSelector 
          activeTier={activeTier} 
          onTierChange={setActiveTier} 
        />
      )}
    </div>
  );
};

export default BattleControls;
