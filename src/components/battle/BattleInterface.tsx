import React, { useState, useEffect, memo } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import { useMilestoneCalculations } from "@/hooks/battle/useMilestoneCalculations";
import { DEFAULT_BATTLE_MILESTONES } from "@/utils/battleMilestones";
import { useBattleValidation } from "./BattleValidation";
import { useBattleAnimationHandler } from "./BattleAnimationHandler";
import { useBattleInteractionHandler } from "./BattleInteractionHandler";
import BattleInterfaceCore from "./BattleInterfaceCore";

interface BattleInterfaceProps {
  currentBattle: Pokemon[];
  selectedPokemon: number[];
  battlesCompleted: number;
  battleType: BattleType;
  battleHistory: { battle: Pokemon[], selected: number[] }[];
  onPokemonSelect: (id: number) => void;
  onTripletSelectionComplete: () => void;
  onGoBack: () => void;
  milestones: number[];
  isProcessing?: boolean;
}

const BattleInterface: React.FC<BattleInterfaceProps> = memo(({
  currentBattle,
  selectedPokemon,
  battlesCompleted,
  battleType,
  battleHistory,
  onPokemonSelect,
  onTripletSelectionComplete,
  onGoBack,
  milestones,
  isProcessing = false
}) => {
  const [displayedBattlesCompleted, setDisplayedBattlesCompleted] = useState(battlesCompleted);
  
  console.log(`🔄 [BATTLE_INTERFACE] BattleInterface render state:`, {
    isProcessing,
    currentBattleLength: currentBattle?.length || 0,
    currentBattleIds: currentBattle?.map(p => p.id) || [],
    hasValidBattle: currentBattle && currentBattle.length > 0,
    milestonesReceived: milestones,
    timestamp: new Date().toISOString()
  });
  
  // CRITICAL FIX: Use the correct milestones array or fallback to default
  const actualMilestones = milestones && milestones.length > 0
    ? milestones
    : DEFAULT_BATTLE_MILESTONES;
  
  console.log(`🎯 [MILESTONE_FIX] Using milestones:`, actualMilestones);
  
  const { getNextMilestone, getMilestoneProgress } = useMilestoneCalculations(
    displayedBattlesCompleted, 
    actualMilestones
  );
  
  const { validatedBattle } = useBattleValidation({
    currentBattle,
    battleType
  });

  const { animationKey } = useBattleAnimationHandler({
    validatedBattle,
    battleType
  });

  const {
    handlePokemonCardSelect,
    handleSubmit,
    handleBackClick
  } = useBattleInteractionHandler({
    isProcessing,
    onPokemonSelect,
    onTripletSelectionComplete,
    onGoBack
  });
  
  useEffect(() => {
    setDisplayedBattlesCompleted(battlesCompleted);
    console.log(`🔢 [BATTLE_INTERFACE] Battles completed updated to: ${battlesCompleted}`);
  }, [battlesCompleted]);
  
  // Don't render if no valid battle - let parent handle loading
  if (!validatedBattle || validatedBattle.length === 0) {
    console.log(`⚠️ [BATTLE_INTERFACE] No validated battle data - component should not render`);
    return null;
  }
  
  return (
    <BattleInterfaceCore
      validatedBattle={validatedBattle}
      selectedPokemon={selectedPokemon}
      displayedBattlesCompleted={displayedBattlesCompleted}
      battleType={battleType}
      battleHistory={battleHistory}
      isProcessing={isProcessing}
      animationKey={animationKey}
      getMilestoneProgress={getMilestoneProgress}
      getNextMilestone={getNextMilestone}
      onPokemonSelect={handlePokemonCardSelect}
      onSubmit={handleSubmit}
      onGoBack={handleBackClick}
    />
  );
});

BattleInterface.displayName = "BattleInterface";

export default BattleInterface;
