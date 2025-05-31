
import { useState } from "react";
import { Pokemon } from "@/services/pokemon";

interface AvailablePokemonDragResult {
  handleDragToRankings: (pokemonId: number, insertIndex?: number) => void;
}

export const useAvailablePokemonDrag = (
  availablePokemon: Pokemon[],
  rankedPokemon: Pokemon[],
  setAvailablePokemon: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setRankedPokemon: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setHasManualChanges: React.Dispatch<React.SetStateAction<boolean>>
): AvailablePokemonDragResult => {
  
  const handleDragToRankings = (pokemonId: number, insertIndex?: number) => {
    console.log(`🔄 [AVAILABLE_DRAG] Moving Pokemon ${pokemonId} to rankings at index ${insertIndex}`);
    
    const pokemon = availablePokemon.find(p => p.id === pokemonId);
    if (!pokemon) {
      console.error(`🔄 [AVAILABLE_DRAG] Pokemon ${pokemonId} not found in available list`);
      return;
    }
    
    // Remove from available
    const newAvailable = availablePokemon.filter(p => p.id !== pokemonId);
    
    // Add to ranked at specified position or at the end
    const newRanked = [...rankedPokemon];
    const targetIndex = insertIndex !== undefined ? insertIndex : newRanked.length;
    newRanked.splice(targetIndex, 0, pokemon);
    
    // Update states
    setAvailablePokemon(newAvailable);
    setRankedPokemon(newRanked);
    setHasManualChanges(true);
    
    console.log(`🔄 [AVAILABLE_DRAG] Successfully moved ${pokemon.name} to rankings`);
  };

  return { handleDragToRankings };
};
