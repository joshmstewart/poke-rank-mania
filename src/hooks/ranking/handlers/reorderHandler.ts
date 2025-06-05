
import { parseId } from "../utils/idParsing";

export const handleRankingReorder = (
  activeId: string,
  overId: string,
  over: any,
  localRankings: any[],
  handleEnhancedManualReorder: (pokemonId: number, sourceIndex: number, destinationIndex: number) => void
) => {
  const { pokemonId: activePokemonId } = parseId(activeId);
  
  if (activePokemonId === null) {
    console.log(`🚀 [ENHANCED_DRAG_END] Invalid active Pokemon ID for reorder`);
    return;
  }

  const oldIndex = localRankings.findIndex(p => p.id === activePokemonId);
  let newIndex = -1;
  
  // Handle both Pokemon-based drops and position-based drops
  const { pokemonId: overPokemonId, positionIndex } = parseId(overId);
  
  if (overPokemonId !== null) {
    // Dropped on another Pokemon
    newIndex = localRankings.findIndex(p => p.id === overPokemonId);
    console.log(`🚀 [ENHANCED_DRAG_END] Reordering to Pokemon ${overPokemonId} position`);
  } else if (positionIndex !== null) {
    // Dropped on an empty position - prefer droppable data index
    const dataIndex = over.data?.current?.index;
    const finalIndex = dataIndex !== undefined ? dataIndex : positionIndex;
    if (finalIndex >= 0 && finalIndex <= localRankings.length) {
      newIndex = Math.min(finalIndex, localRankings.length - 1); // Ensure we don't exceed bounds
      console.log(
        `🚀 [ENHANCED_DRAG_END] Reordering to position slot ${finalIndex} (from ${dataIndex !== undefined ? 'data' : 'id'}) -> ${newIndex}`
      );
    }
  }
  
  // Fall back to using the droppable slot's index if nothing else worked
  if (newIndex === -1 && over.data?.current?.index !== undefined) {
    newIndex = Math.min(over.data.current.index, localRankings.length - 1);
    console.log(`🚀 [ENHANCED_DRAG_END] Using fallback index from data: ${newIndex}`);
  }
  
  if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
    console.log(`🚀 [ENHANCED_DRAG_END] Reordering from ${oldIndex} to ${newIndex}`);
    try {
      handleEnhancedManualReorder(activePokemonId, oldIndex, newIndex);
    } catch (error) {
      console.error(`🚀 [ENHANCED_DRAG_END] Reorder failed:`, error);
    }
  } else {
    console.log(`🚀 [ENHANCED_DRAG_END] No reorder needed: oldIndex=${oldIndex}, newIndex=${newIndex}`);
  }
};
