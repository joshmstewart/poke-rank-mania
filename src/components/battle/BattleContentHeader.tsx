
import React from "react";
import BattleControls from "./BattleControls";
import { BattleType } from "@/hooks/battle/types";
import { SingleBattle } from "@/hooks/battle/types";

interface BattleContentHeaderProps {
  selectedGeneration: number;
  battleType: BattleType;
  onGenerationChange: (gen: number) => void;
  setBattleType: (type: BattleType) => void;
  performFullBattleReset: () => void;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
}

const BattleContentHeader: React.FC<BattleContentHeaderProps> = ({
  selectedGeneration,
  battleType,
  onGenerationChange,
  setBattleType,
  performFullBattleReset,
  setBattlesCompleted,
  setBattleResults
}) => {
  return (
    <div>
      {/* Main Battle Controls */}
      <BattleControls
        selectedGeneration={selectedGeneration}
        battleType={battleType}
        onGenerationChange={(gen) => onGenerationChange(Number(gen))}
        onBattleTypeChange={setBattleType}
        onRestartBattles={performFullBattleReset}
        setBattlesCompleted={setBattlesCompleted}
        setBattleResults={setBattleResults}
        performFullBattleReset={performFullBattleReset}
      />
    </div>
  );
};

export default BattleContentHeader;
