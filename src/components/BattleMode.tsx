
import React from "react";
import { BattleModeProvider } from "./battle/BattleModeProvider";
import { RefinementQueueProvider } from "./battle/RefinementQueueProvider";

const BattleMode = () => {
  console.log('🔥 BattleMode: Component rendering');
  
  return (
    <RefinementQueueProvider>
      <BattleModeProvider />
    </RefinementQueueProvider>
  );
};

export default BattleMode;
