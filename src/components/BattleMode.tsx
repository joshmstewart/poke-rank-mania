
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
      <div className="mb-6">
        <BattleHeader />
      </div>
      <ProgressTracker
        completionPercentage={completionPercentage}
        battlesCompleted={battlesCompleted}
        getBattlesRemaining={getBattlesRemaining}
      />
      <div className="mt-6">
        <BattleContentContainer />
      </div>
      <BattleFooterNote
        battlesCompleted={battlesCompleted}
      />
    </div>
  );
};

export default BattleMode;
