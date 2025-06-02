
import React from "react";
import { LoadingType } from "@/hooks/pokemon/types";
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
  console.log(`🔮 [ENHANCED_RANKING_UI] ===== ENHANCED RankingUI RENDER =====`);
  console.log(`🔮 [ENHANCED_RANKING_UI] RankingUI rendered with ${rankedPokemon.length} ranked Pokemon`);

  // Use extracted state management
  const { battleType, setBattleType } = useRankingUIState();

  // Use enhanced data processing with new features
  const {
    localRankings,
    updateLocalRankings,
    displayRankings,
    filteredAvailablePokemon,
    enhancedAvailablePokemon
  } = useRankingDataProcessing({
    availablePokemon,
    rankedPokemon,
    selectedGeneration,
    totalPages
  });

  console.log(`🔮 [ENHANCED_RANKING_UI] After enhanced processing: ${localRankings.length} local, ${displayRankings.length} display rankings`);
  console.log(`🔮 [ENHANCED_RANKING_UI] Enhanced available Pokemon: ${enhancedAvailablePokemon.length}`);

  return (
    <RankingUICore
      isLoading={isLoading}
      availablePokemon={availablePokemon}
      displayRankings={displayRankings}
      filteredAvailablePokemon={filteredAvailablePokemon}
      enhancedAvailablePokemon={enhancedAvailablePokemon}
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
