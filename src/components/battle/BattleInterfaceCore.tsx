
import React, { memo } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import BattleHeader from "./BattleHeader";
import BattleProgress from "./BattleProgress";
import BattleGrid from "./BattleGrid";
import BattleSubmitButton from "./BattleSubmitButton";

interface BattleInterfaceCoreProps {
  validatedBattle: Pokemon[];
  selectedPokemon: number[];
  displayedBattlesCompleted: number;
  battleType: BattleType;
  battleHistory: { battle: Pokemon[], selected: number[] }[];
  isProcessing: boolean;
  animationKey: number;
  getMilestoneProgress: () => number;
  getNextMilestone: () => number;
  onPokemonSelect: (id: number) => void;
  onSubmit: () => void;
  onGoBack: () => void;
}

const BattleInterfaceCore: React.FC<BattleInterfaceCoreProps> = memo(({
  validatedBattle,
  selectedPokemon,
  displayedBattlesCompleted,
  battleType,
  battleHistory,
  isProcessing,
  animationKey,
  getMilestoneProgress,
  getNextMilestone,
  onPokemonSelect,
  onSubmit,
  onGoBack
}) => {
  const shouldShowSubmitButton = battleType === "triplets";
  
  console.log(`✅ [BATTLE_INTERFACE_CORE] Rendering interface with ${validatedBattle.length} Pokemon`);
  
  return (
    <div className="bg-white rounded-lg shadow p-4 w-full">
      <div className="mb-3">
        <BattleHeader
          battlesCompleted={displayedBattlesCompleted}
          onGoBack={onGoBack}
          hasHistory={battleHistory.length > 0}
          isProcessing={isProcessing}
          internalProcessing={false}
        />
        
        <BattleProgress
          battlesCompleted={displayedBattlesCompleted}
          getMilestoneProgress={getMilestoneProgress}
          getNextMilestone={getNextMilestone}
        />
      </div>
      
      <BattleGrid
        currentBattle={validatedBattle}
        selectedPokemon={selectedPokemon}
        onPokemonSelect={onPokemonSelect}
        battleType={battleType}
        isProcessing={isProcessing}
        internalProcessing={false}
        animationKey={animationKey}
      />
      
      {shouldShowSubmitButton && (
        <BattleSubmitButton
          onSubmit={onSubmit}
          isProcessing={isProcessing}
          internalProcessing={false}
          hasSelections={selectedPokemon.length > 0}
        />
      )}
    </div>
  );
});

BattleInterfaceCore.displayName = "BattleInterfaceCore";

export default BattleInterfaceCore;
