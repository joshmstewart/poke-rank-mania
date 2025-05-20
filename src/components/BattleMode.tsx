import React from "react";
import BattleContentContainer from "./battle/BattleContentContainer";
import BattleHeader from "./battle/BattleHeader";
import ProgressTracker from "./battle/ProgressTracker";
import BattleFooterNote from "./battle/BattleFooterNote";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";

const BattleMode: React.FC = () => {
  const {
    completionPercentage,
    battlesCompleted,
    getBattlesRemaining,
  } = useBattleStateCore();

  return (
    <div className="container mx-auto py-4">
      <BattleHeader />
      <ProgressTracker
        completionPercentage={completionPercentage}
        battlesCompleted={battlesCompleted}
        getBattlesRemaining={getBattlesRemaining} // ✅ Correct prop name
      />
      <BattleContentContainer />
      <BattleFooterNote
        battlesCompleted={battlesCompleted} // ✅ Fixed missing required prop
      />
    </div>
  );
};

export default BattleMode;
