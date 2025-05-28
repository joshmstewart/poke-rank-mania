
import React, { useMemo } from "react";
import BattleContentContainer from "@/components/battle/BattleContentContainer";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";

interface BattleModeContainerProps {
  allPokemon: Pokemon[];
  initialBattleType: BattleType;
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
}

const BattleModeContainer: React.FC<BattleModeContainerProps> = ({
  allPokemon,
  initialBattleType,
  setBattlesCompleted,
  setBattleResults
}) => {
  // CRITICAL FIX: Static component key that NEVER changes once Pokemon are loaded
  const containerKey = useMemo(() => `battle-container-stable`, []);
  
  console.log(`🔒 [POKEMON_LOADING_FIX] BattleModeContainer rendering with STABLE containerKey: ${containerKey}, Pokemon count: ${allPokemon.length}`);

  return (
    <div className="flex flex-col items-center w-full py-4 px-4 sm:px-6">
      <BattleContentContainer
        key={containerKey}
        allPokemon={allPokemon}
        initialBattleType={initialBattleType}
        initialSelectedGeneration={0}
        setBattlesCompleted={setBattlesCompleted}
        setBattleResults={setBattleResults}
      />
    </div>
  );
};

export default BattleModeContainer;
