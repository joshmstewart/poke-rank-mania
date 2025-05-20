import React from "react";
import BattleContentContainer from "./battle/BattleContentContainer";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";

const battleState = useBattleState([], "pairs", 0);
const { loadPokemon } = usePokemonLoader(
  battleState.setCurrentBattle,
  battleState.setRankingGenerated,
  battleState.setBattlesCompleted,
  battleState.setBattleResults,
  battleState.setBattleHistory,
  battleState.setShowingMilestone,
  battleState.setCompletionPercentage,
  battleState.setSelectedPokemon,
  battleState.currentBattleType
);

  return (
    <div className="flex flex-col">
      <BattleContentContainer 
        allPokemon={allPokemon} 
        initialBattleType="pairs" 
        initialSelectedGeneration={0}
      />
    </div>
  );
};

export default BattleMode;
