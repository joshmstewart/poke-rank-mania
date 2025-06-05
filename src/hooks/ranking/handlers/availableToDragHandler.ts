
import { Rating } from "ts-trueskill";
import { parseId } from "../utils/idParsing";

export const handleAvailableToRankingsDrop = (
  pokemonId: number,
  overId: string,
  over: any,
  enhancedAvailablePokemon: any[],
  localRankings: any[],
  updateRating: (id: string, rating: Rating) => void,
  handleEnhancedManualReorder: (
    pokemonId: number,
    sourceIndex: number,
    destinationIndex: number,
    pokemon?: any
  ) => void,
  triggerReRanking: (pokemonId: number) => Promise<void>
) => {
  console.log(`🚀 [ENHANCED_DRAG_END] Available Pokemon ${pokemonId} dragged to ${overId}`);
  
  // Accept any ranking-related drop target
  const isValidDropTarget = (
    overId === 'rankings-drop-zone' ||
    overId === 'rankings-grid-drop-zone' ||
    /^ranking-(?:position-)?\d+$/.test(overId) ||
    over.data?.current?.type === 'ranking-position' ||
    over.data?.current?.type === 'ranked-pokemon' ||
    over.data?.current?.type === 'rankings-container' ||
    over.data?.current?.accepts?.includes('available-pokemon')
  );
  
  if (!isValidDropTarget) {
    console.log(`🚀 [ENHANCED_DRAG_END] Invalid drop target - ignoring`);
    return;
  }

  const pokemon = enhancedAvailablePokemon.find(p => p.id === pokemonId);
  if (!pokemon) {
    console.error(`🚀 [ENHANCED_DRAG_END] Pokemon ${pokemonId} not found`);
    return;
  }

  console.log(`🚀 [ENHANCED_DRAG_END] Found pokemon: ${pokemon.name}, isRanked: ${pokemon.isRanked}`);
  
  if (pokemon.isRanked) {
    // Re-rank existing Pokemon
    console.log(`🔥 [RE_RANK_POKEMON] Re-ranking ${pokemon.name}`);
    if (triggerReRanking) {
      triggerReRanking(pokemonId).catch(console.error);
    }
  } else {
    // Add new Pokemon to rankings
    console.log(`🔥 [ADD_NEW_POKEMON] Adding ${pokemon.name} to rankings`);
    
    // Add to TrueSkill store
    const defaultRating = new Rating(25.0, 8.333);
    updateRating(pokemonId.toString(), defaultRating);
    
    // Enhanced insertion position logic with proper ID handling
    let insertionPosition = localRankings.length;
    
    // Parse the drop target ID
    const { pokemonId: targetPokemonId, positionIndex } = parseId(overId);
    
    if (targetPokemonId !== null) {
      // Dropped on a filled slot - insert before this Pokemon
      const targetIndex = localRankings.findIndex(p => p.id === targetPokemonId);
      if (targetIndex !== -1) {
        insertionPosition = targetIndex;
        console.log(`🔥 [ADD_NEW_POKEMON] Inserting before Pokemon ${targetPokemonId} at position ${targetIndex}`);
      }
    } else if (positionIndex !== null) {
      // Dropped on an empty slot - prefer the droppable data index
      const dataIndex = over.data?.current?.index;
      const finalIndex = dataIndex !== undefined ? dataIndex : positionIndex;
      if (finalIndex >= 0 && finalIndex <= localRankings.length) {
        insertionPosition = finalIndex;
        console.log(
          `🔥 [ADD_NEW_POKEMON] Inserting at empty slot position ${finalIndex} (from ${dataIndex !== undefined ? 'data' : 'id'})`
        );
      }
    }
    
    // Final fallback to over.data for insertion position
    if (over.data?.current?.index !== undefined && 
        (insertionPosition === localRankings.length || insertionPosition < 0)) {
      insertionPosition = over.data.current.index;
      console.log(`🔥 [ADD_NEW_POKEMON] Using fallback position from data: ${insertionPosition}`);
    }
    
    console.log(`🔥 [ADD_NEW_POKEMON] Final insertion position: ${insertionPosition}`);
    
    try {
      handleEnhancedManualReorder(pokemonId, -1, insertionPosition, pokemon);
      console.log(`🔥 [ADD_NEW_POKEMON] Successfully added ${pokemon.name}`);
    } catch (error) {
      console.error(`🔥 [ADD_NEW_POKEMON] Failed to add Pokemon:`, error);
    }
  }
};
