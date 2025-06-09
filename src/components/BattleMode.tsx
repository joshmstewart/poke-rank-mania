
import React from "react";
import BattleModeCore from "./battle/BattleModeCore";
import { RefinementQueueProvider } from "./battle/RefinementQueueProvider";

const BattleMode = () => {
  console.log('🔥 BattleMode: Component rendering');
  
  return (
    <RefinementQueueProvider>
      <BattleModeCore />
    </RefinementQueueProvider>
  );
};

export default BattleMode;
