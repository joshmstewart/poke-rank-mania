
import React, { useEffect } from "react";
import { BattleType } from "@/hooks/battle/types";
import { LoadingType } from "@/hooks/pokemon/types";
import { RankingsSection } from "./RankingsSection";
import EnhancedAvailablePokemonSection from "./EnhancedAvailablePokemonSection";
import UnifiedControls from "@/components/shared/UnifiedControls";
import { Card } from "@/components/ui/card";
import { useUnifiedDrag } from "@/providers/UnifiedDragProvider";
import { useScoreInterpolation } from "@/hooks/unified/useScoreInterpolation";
import { arrayMove } from "@dnd-kit/sortable";

interface EnhancedRankingLayoutProps {
  isLoading: boolean;
  availablePokemon: any[];
  enhancedAvailablePokemon: any[];
  displayRankings: any[];
  selectedGeneration: number;
  loadingType: LoadingType;
  currentPage: number;
  totalPages: number;
  loadSize: number;
  loadingRef: React.RefObject<HTMLDivElement>;
  battleType: BattleType;
  activeDraggedPokemon: any;
  dragSourceInfo: {fromAvailable: boolean, isRanked: boolean} | null;
  sourceCardProps: any;
  filteredAvailablePokemon: any[];
  sensors: any;
  handlePageChange: (page: number) => void;
  getPageRange: () => number[];
  onGenerationChange: (gen: number) => void;
  handleComprehensiveReset: () => void;
  setBattleType: React.Dispatch<React.SetStateAction<BattleType>>;
  handleDragStart: (event: any) => void;
  handleDragEnd: (event: any) => void;
  handleManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  handleLocalReorder: (newRankings: any[]) => void;
  setAvailablePokemon: React.Dispatch<React.SetStateAction<any[]>>;
  setRankedPokemon: React.Dispatch<React.SetStateAction<any[]>>;
}

export const EnhancedRankingLayout: React.FC<EnhancedRankingLayoutProps> = ({
  isLoading,
  availablePokemon,
  enhancedAvailablePokemon,
  displayRankings,
  selectedGeneration,
  loadingType,
  currentPage,
  totalPages,
  loadSize,
  loadingRef,
  battleType,
  activeDraggedPokemon,
  dragSourceInfo,
  sourceCardProps,
  filteredAvailablePokemon,
  sensors,
  handlePageChange,
  getPageRange,
  onGenerationChange,
  handleComprehensiveReset,
  setBattleType,
  handleDragStart,
  handleDragEnd,
  handleManualReorder,
  handleLocalReorder,
  setAvailablePokemon,
  setRankedPokemon
}) => {
  const { registerDragHandlers } = useUnifiedDrag();
  const { calculateInsertionScore, updatePokemonScore } = useScoreInterpolation();

  useEffect(() => {
    registerDragHandlers({
      onAvailableToRanked: (pokemonId: number, insertionIndex: number, pokemon: any) => {
        console.log(`🎯 [UNIFIED] Moving Pokemon ${pokemonId} to ranked at index ${insertionIndex}`);
        
        // Remove from available
        setAvailablePokemon(prev => prev.filter(p => p.id !== pokemonId));
        
        // Calculate score based on neighbors
        const newScore = calculateInsertionScore(displayRankings as any[], insertionIndex);
        const rankedPokemon = updatePokemonScore(pokemon, newScore);
        
        // Add to ranked at the correct position
        setRankedPokemon(prev => {
          const newRankings = [...prev];
          newRankings.splice(insertionIndex, 0, rankedPokemon);
          return newRankings;
        });
      },
      onRankedReorder: (pokemonId: number, oldIndex: number, newIndex: number) => {
        console.log(`🎯 [UNIFIED] Reordering Pokemon ${pokemonId} from ${oldIndex} to ${newIndex}`);
        
        setRankedPokemon(prev => {
          const newOrder = arrayMove(prev, oldIndex, newIndex);
          // Recalculate scores based on new positions
          return newOrder.map((pokemon, index) => ({
            ...pokemon,
            score: 1000 - (index * 10), // Simple scoring system based on position
          }));
        });
      },
      getAvailablePokemon: () => enhancedAvailablePokemon,
      getRankedPokemon: () => displayRankings,
    });
  }, [
    registerDragHandlers,
    enhancedAvailablePokemon,
    displayRankings,
    setAvailablePokemon,
    setRankedPokemon,
    calculateInsertionScore,
    updatePokemonScore
  ]);

  const handleManualModeReset = () => {
    handleComprehensiveReset();
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Settings Section */}
      <div className="max-w-7xl mx-auto mb-4">
        <UnifiedControls
          selectedGeneration={selectedGeneration}
          battleType={battleType}
          onGenerationChange={(gen) => onGenerationChange(Number(gen))}
          onBattleTypeChange={setBattleType}
          showBattleTypeControls={true}
          mode="manual"
          onReset={handleComprehensiveReset}
          customResetAction={handleManualModeReset}
        />
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-4" style={{ height: 'calc(200vh - 12rem)' }}>
          {/* Enhanced Available Pokemon Card */}
          <Card className="shadow-lg border border-gray-200 flex flex-col">
            <EnhancedAvailablePokemonSection
              availablePokemon={enhancedAvailablePokemon}
              rankedPokemon={displayRankings}
            />
          </Card>

          {/* Rankings Card */}
          <Card className="shadow-lg border border-gray-200 flex flex-col">
            <RankingsSection
              displayRankings={displayRankings}
              pendingRefinements={new Set()}
              availablePokemon={enhancedAvailablePokemon}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};
