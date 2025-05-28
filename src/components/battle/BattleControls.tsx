
import React from "react";
import { BattleType } from "@/hooks/battle/types";
import { SingleBattle } from "@/hooks/battle/types";
import BattleControlsContainer from "./BattleControlsContainer";

interface BattleControlsProps {
  selectedGeneration: number;
  battleType: BattleType;
  onGenerationChange: (generation: string) => void;
  onBattleTypeChange: (type: BattleType) => void;
  onRestartBattles: () => void;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
  performFullBattleReset?: () => void;
}

const BattleControls: React.FC<BattleControlsProps> = (props) => {
  return <BattleControlsContainer {...props} />;
};

export default BattleControls;
