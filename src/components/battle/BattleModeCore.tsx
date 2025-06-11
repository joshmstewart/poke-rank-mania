
import React from "react";
import BattleModeProvider from "./BattleModeProvider";
import BattleModeContainer from "./BattleModeContainer";

const BattleModeCore: React.FC = () => {
  console.log('🔥 BattleModeCore: Component rendering');
  
  return (
    <BattleModeProvider>
      <BattleModeContainer />
    </BattleModeProvider>
  );
};

export default BattleModeCore;
