
import React, { useState, useEffect, useCallback } from "react";
import BattleContentHeader from "./BattleContentHeader";
import BattleContentRenderer from "./BattleContentRenderer";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";

interface BattleModeContainerProps {
  allPokemon: Pokemon[];
  initialBattleType: BattleType;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
}

const BattleModeContainer: React.FC<BattleModeContainerProps> = ({
  allPokemon,
  initialBattleType,
  setBattlesCompleted,
  setBattleResults
}) => {
  console.log(`🔧 [BATTLE_MODE_CONTAINER] Rendering with ${allPokemon.length} Pokemon`);
  
  const [selectedGeneration, setSelectedGeneration] = useState(0);

  // CRITICAL FIX: Use the battle state from the core hook directly
  const battleState = useBattleStateCore(allPokemon, initialBattleType, selectedGeneration);

  // CRITICAL FIX: Sync external state setters with internal battle state
  useEffect(() => {
    if (setBattlesCompleted) {
      setBattlesCompleted(battleState.battlesCompleted);
    }
    if (setBattleResults) {
      setBattleResults(battleState.battleResults);
    }
  }, [battleState.battlesCompleted, battleState.battleResults, setBattlesCompleted, setBattleResults]);

  // CRITICAL FIX: Listen for reset events and force re-render
  useEffect(() => {
    const handleBattleSystemReset = () => {
      console.log(`🔄 [CONTAINER_RESET] Forcing state sync after reset`);
      // Force immediate sync of the reset values
      if (setBattlesCompleted) {
        setBattlesCompleted(0);
      }
      if (setBattleResults) {
        setBattleResults([]);
      }
    };

    document.addEventListener('battle-system-reset', handleBattleSystemReset);
    
    return () => {
      document.removeEventListener('battle-system-reset', handleBattleSystemReset);
    };
  }, [setBattlesCompleted, setBattleResults]);

  const handleGenerationChange = useCallback((gen: number) => {
    console.log(`🔧 [BATTLE_MODE_CONTAINER] Generation changed to: ${gen}`);
    setSelectedGeneration(gen);
    battleState.setSelectedGeneration(gen);
  }, [battleState]);

  const handleBattleTypeChange = useCallback((type: BattleType) => {
    console.log(`🔧 [BATTLE_MODE_CONTAINER] Battle type changed to: ${type}`);
    battleState.setBattleType(type);
  }, [battleState]);

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <BattleContentHeader
          selectedGeneration={selectedGeneration}
          battleType={battleState.battleType}
          onGenerationChange={handleGenerationChange}
          setBattleType={handleBattleTypeChange}
          performFullBattleReset={battleState.performFullBattleReset}
          setBattlesCompleted={setBattlesCompleted}
          setBattleResults={setBattleResults}
        />

        <BattleContentRenderer
          battleState={battleState}
          allPokemon={allPokemon}
        />
      </div>
    </div>
  );
};

export default BattleModeContainer;
