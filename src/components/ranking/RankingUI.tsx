
import React from "react";
import { LoadingType } from "@/hooks/usePokemonRanker";
import { useRankingUIState } from "@/hooks/ranking/useRankingUIState";
import { useRankingDataProcessing } from "@/hooks/ranking/useRankingDataProcessing";
import { RankingUICore } from "./RankingUICore";

interface RankingUIProps {
  isLoading: boolean;
  availablePokemon: any[];
  rankedPokemon: any[];
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
  onGenerationChange: (gen: number) => void;
  onReset: () => void;
}

export const RankingUI: React.FC<RankingUIProps> = ({
  isLoading,
  availablePokemon,
  rankedPokemon,
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
  onGenerationChange,
  onReset
}) => {
  // Use extracted state management
  const { battleType, setBattleType } = useRankingUIState();

  // Use extracted data processing
  const {
    localRankings,
    updateLocalRankings,
    displayRankings,
    filteredAvailablePokemon
  } = useRankingDataProcessing({
    availablePokemon,
    rankedPokemon,
    selectedGeneration,
    totalPages
  });

  return (
    <RankingUICore
      isLoading={isLoading}
      availablePokemon={availablePokemon}
      displayRankings={displayRankings}
      filteredAvailablePokemon={filteredAvailablePokemon}
      localRankings={localRankings}
      updateLocalRankings={updateLocalRankings}
      selectedGeneration={selectedGeneration}
      loadingType={loadingType}
      currentPage={currentPage}
      totalPages={totalPages}
      loadSize={loadSize}
      loadingRef={loadingRef}
      battleType={battleType}
      setBattleType={setBattleType}
      setAvailablePokemon={setAvailablePokemon}
      setRankedPokemon={setRankedPokemon}
      handlePageChange={handlePageChange}
      getPageRange={getPageRange}
      onGenerationChange={onGenerationChange}
      onReset={onReset}
    />
  );
};
