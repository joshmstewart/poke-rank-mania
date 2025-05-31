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
  
  // Prioritize manual rankings: if user has manually ranked Pokemon, show those first
  // Otherwise fall back to TrueSkill rankings
  const displayRankings = rankedPokemon.length > 0 ? rankedPokemon 
    : localRankings.length > 0 ? localRankings 
    : battleModeRankings.length > 0 ? battleModeRankings 
    : [];
  
  // Filter available Pokemon to exclude those in the DISPLAY rankings
  const displayRankingsIds = new Set(displayRankings.map(p => p.id));
  const filteredAvailablePokemon = availablePokemon.filter(p => !displayRankingsIds.has(p.id));
  
  console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] Manual rankedPokemon: ${rankedPokemon.length}, localRankings: ${localRankings.length}, battleModeRankings: ${battleModeRankings.length}`);
  console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] displayRankings length: ${displayRankings.length}`);
  console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] Using manual rankings: ${rankedPokemon.length > 0}`);
  console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] filteredAvailablePokemon length: ${filteredAvailablePokemon.length}`);
  console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] displayRankingsIds:`, Array.from(displayRankingsIds));

  // Use the actual state arrays for drag and drop - pass the original arrays, not filtered
  const { handleDragEnd } = useDragHandler(
    availablePokemon, // Pass original array
    rankedPokemon,    // Pass actual ranked state
    setAvailablePokemon,
    setRankedPokemon
  );

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
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen p-1">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-2" style={{ height: 'calc(100vh - 4rem)' }}>
            {/* Left side - Available Pokemon (unrated) with enhanced styling */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col">
              <AvailablePokemonSection
                availablePokemon={filteredAvailablePokemon}
                isLoading={isLoading}
                selectedGeneration={selectedGeneration}
                loadingType={loadingType}
                currentPage={currentPage}
                totalPages={totalPages}
                loadingRef={loadingRef}
                handlePageChange={handlePageChange}
                getPageRange={getPageRange}
              />
            </div>
            
            {/* Right side - Rankings with enhanced styling */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col">
              <RankingsSection displayRankings={displayRankings} />
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};
