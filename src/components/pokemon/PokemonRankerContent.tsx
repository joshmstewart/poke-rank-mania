
import React from "react";
import { RankedPokemon } from "@/services/pokemon";
import { RankingResults } from "../ranking/RankingResults";
import { RankingUI } from "../ranking/RankingUI";
import { LoadingType } from "@/hooks/usePokemonRanker";

interface PokemonRankerContentProps {
  showRankings: boolean;
  isLoading: boolean;
  availablePokemon: any[];
  rankedPokemon: any[];
  typedRankedPokemon: RankedPokemon[];
  confidenceScores: Record<number, number>;
  selectedGeneration: number;
  loadingType: LoadingType;
  currentPage: number;
  totalPages: number;
  loadSize: number;
  loadingRef: React.RefObject<HTMLDivElement>;
  setAvailablePokemon: React.Dispatch<React.SetStateAction<any[]>>;
  setRankedPokemon: React.Dispatch<React.SetStateAction<any[]>>;
  handlePageChange: (page: number) => void;
  getPageRange: () => number[];
  suggestRanking: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  removeSuggestion: (pokemonId: number) => void;
  clearAllSuggestions: () => void;
  onGenerationChange: (gen: number) => void;
  onReset: () => void;
}

export const PokemonRankerContent: React.FC<PokemonRankerContentProps> = ({
  showRankings,
  isLoading,
  availablePokemon,
  rankedPokemon,
  typedRankedPokemon,
  confidenceScores,
  selectedGeneration,
  loadingType,
  currentPage,
  totalPages,
  loadSize,
  loadingRef,
  setAvailablePokemon,
  setRankedPokemon,
  handlePageChange,
  getPageRange,
  suggestRanking,
  removeSuggestion,
  clearAllSuggestions,
  onGenerationChange,
  onReset
}) => {
  if (showRankings) {
    return (
      <RankingResults
        confidentRankedPokemon={typedRankedPokemon}
        confidenceScores={confidenceScores}
        onSuggestRanking={suggestRanking}
        onRemoveSuggestion={removeSuggestion}
        onClearSuggestions={clearAllSuggestions}
      />
    );
  }

  return (
    <RankingUI
      isLoading={isLoading}
      availablePokemon={availablePokemon}
      rankedPokemon={rankedPokemon}
      selectedGeneration={selectedGeneration}
      loadingType={loadingType}
      currentPage={currentPage}
      totalPages={totalPages}
      loadSize={loadSize}
      loadingRef={loadingRef}
      setAvailablePokemon={setAvailablePokemon}
      setRankedPokemon={setRankedPokemon}
      handlePageChange={handlePageChange}
      getPageRange={getPageRange}
      onGenerationChange={onGenerationChange}
      onReset={onReset}
    />
  );
};
