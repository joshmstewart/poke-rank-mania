
import React from "react";
import { Pokemon, TopNOption, RankedPokemon } from "@/services/pokemon";
import RankingDisplayContainer from "./RankingDisplayContainer";

interface RankingDisplayProps {
  finalRankings: Pokemon[] | RankedPokemon[];
  battlesCompleted: number;
  onContinueBattles: () => void;
  onNewBattleSet: () => void;
  rankingGenerated: boolean;
  onSaveRankings: () => void;
  isMilestoneView?: boolean;
  activeTier?: TopNOption;
  onTierChange?: (tier: TopNOption) => void;
  onSuggestRanking?: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion?: (pokemonId: number) => void;
  onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  pendingRefinements?: Set<number>;
  enableDragAndDrop?: boolean;
}

const RankingDisplay: React.FC<RankingDisplayProps> = (props) => {
  return <RankingDisplayContainer {...props} />;
};

export default RankingDisplay;
