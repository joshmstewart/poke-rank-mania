
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import BattleContentCore from "./BattleContentCore";

interface BattleContentProps {
  allPokemon: Pokemon[];
  initialBattleType: BattleType;
  initialSelectedGeneration: number;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
}

const BattleContent: React.FC<BattleContentProps> = (props) => {
  return <BattleContentCore {...props} />;
};

export default BattleContent;
