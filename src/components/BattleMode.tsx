
import React from "react";
import BattleModeContainer from "./battle/BattleModeContainer";

const BattleMode = () => {
  console.log('🔥 BattleMode: Component rendering');
  
  // Return the container instead of core, as it handles the props properly
  return <BattleModeContainer 
    allPokemon={[]} 
    initialBattleType="standard"
  />;
};

export default BattleMode;
