
import { useState, useCallback } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { useDragStartHandler } from "./handlers/dragStartHandler";
import { useDragEndHandler } from "./handlers/dragEndHandler";

export const useEnhancedRankingDragDrop = (
  enhancedAvailablePokemon: any[],
  localRankings: any[],
  setAvailablePokemon: React.Dispatch<React.SetStateAction<any[]>>,
  handleEnhancedManualReorder: (
    pokemonId: number,
    sourceIndex: number,
    destinationIndex: number,
    pokemon?: any
  ) => void,
  triggerReRanking: (pokemonId: number) => Promise<void>
) => {
  const [activeDraggedPokemon, setActiveDraggedPokemon] = useState<any>(null);
  const { updateRating } = useTrueSkillStore();

  const handleDragStart = useDragStartHandler(
    enhancedAvailablePokemon,
    localRankings,
    setActiveDraggedPokemon
  );

  const handleDragEnd = useDragEndHandler(
    enhancedAvailablePokemon,
    localRankings,
    updateRating,
    handleEnhancedManualReorder,
    triggerReRanking,
    setActiveDraggedPokemon
  );

  const handleManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log(`🚀 [ENHANCED_MANUAL_REORDER] Pokemon ${draggedPokemonId} moved from ${sourceIndex} to ${destinationIndex}`);
    try {
      handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
    } catch (error) {
      console.error(`🚀 [ENHANCED_MANUAL_REORDER] Failed:`, error);
    }
  }, [handleEnhancedManualReorder]);

  return {
    activeDraggedPokemon,
    handleDragStart,
    handleDragEnd,
    handleManualReorder
  };
};
