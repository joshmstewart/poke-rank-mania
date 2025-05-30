
import React from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { LoadingState } from "./LoadingState";
import { AvailablePokemonSection } from "./AvailablePokemonSection";
import { RankingsSection } from "./RankingsSection";
import { useDragHandler } from "./useDragHandler";
import { useTrueSkillSync } from "@/hooks/ranking/useTrueSkillSync";
import { useRankings } from "@/hooks/battle/useRankings";
import { LoadingType } from "@/hooks/usePokemonRanker";
import { ITEMS_PER_PAGE } from "@/services/pokemon";

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
  getPageRange
}) => {
  // Get TrueSkill-based rankings from Battle Mode system
  const { finalRankings: battleModeRankings } = useRankings();
  
  // Get local rankings from TrueSkill sync
  const { localRankings } = useTrueSkillSync();
  
  // Use local rankings if available, otherwise fall back to battle mode rankings, then manual rankings
  const displayRankings = localRankings.length > 0 ? localRankings 
    : battleModeRankings.length > 0 ? battleModeRankings 
    : rankedPokemon;

  const { handleDragEnd } = useDragHandler(
    availablePokemon,
    rankedPokemon,
    setAvailablePokemon,
    setRankedPokemon
  );

  // Temporarily disable drag-and-drop for Manual Mode TrueSkill integration
  const handleDisabledDragEnd = () => {
    console.log("[TRUESKILL_MANUAL] Drag-and-drop temporarily disabled in Manual Mode");
  };

  if (isLoading && availablePokemon.length === 0) {
    return (
      <LoadingState 
        selectedGeneration={selectedGeneration} 
        loadSize={loadSize} 
        itemsPerPage={ITEMS_PER_PAGE}
        loadingType={loadingType}
      />
    );
  }

  return (
    <div className="container max-w-7xl mx-auto space-y-6">
      <DragDropContext onDragEnd={handleDisabledDragEnd}>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left side - Available Pokemon */}
          <AvailablePokemonSection
            availablePokemon={availablePokemon}
            isLoading={isLoading}
            selectedGeneration={selectedGeneration}
            loadingType={loadingType}
            currentPage={currentPage}
            totalPages={totalPages}
            loadingRef={loadingRef}
            handlePageChange={handlePageChange}
            getPageRange={getPageRange}
          />
          
          {/* Right side - Rankings */}
          <RankingsSection displayRankings={displayRankings} />
        </div>
      </DragDropContext>
    </div>
  );
};
