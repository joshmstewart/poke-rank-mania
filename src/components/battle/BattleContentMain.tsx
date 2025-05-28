
import React from "react";
import BattleInterface from "./BattleInterface";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";

interface BattleContentMainProps {
  currentBattle: Pokemon[];
  selectedPokemon: number[];
  battlesCompleted: number;
  battleType: BattleType;
  battleHistory: { battle: Pokemon[], selected: number[] }[];
  onPokemonSelect: (id: number) => void;
  onTripletSelectionComplete: () => void;
  onGoBack: () => void;
  milestones: number[];
  isAnyProcessing: boolean;
}

const BattleContentMain: React.FC<BattleContentMainProps> = ({
  currentBattle,
  selectedPokemon,
  battlesCompleted,
  battleType,
  battleHistory,
  onPokemonSelect,
  onTripletSelectionComplete,
  onGoBack,
  milestones,
  isAnyProcessing
}) => {
  return (
    <BattleInterface
      currentBattle={currentBattle}
      selectedPokemon={selectedPokemon}
      battlesCompleted={battlesCompleted}
      battleType={battleType}
      battleHistory={battleHistory}
      onPokemonSelect={onPokemonSelect}
      onTripletSelectionComplete={onTripletSelectionComplete}
      onGoBack={onGoBack}
      milestones={milestones}
      isProcessing={isAnyProcessing}
    />
  );
};

export default BattleContentMain;
