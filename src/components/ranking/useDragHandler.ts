
import { useState } from "react";
import { DropResult } from "react-beautiful-dnd";
import { Pokemon } from "@/services/pokemon";

interface DragHandlerResult {
  handleDragEnd: (result: DropResult) => void;
}

export const useDragHandler = (
  availablePokemon: Pokemon[],
  rankedPokemon: Pokemon[],
  setAvailablePokemon: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setRankedPokemon: React.Dispatch<React.SetStateAction<Pokemon[]>>
): DragHandlerResult => {
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    console.log("🔄 Drag ended:", { source, destination });
    console.log("🔄 Available Pokemon count:", availablePokemon.length);
    console.log("🔄 Ranked Pokemon count:", rankedPokemon.length);
    
    // Dropped outside of any droppable area
    if (!destination) {
      console.log("🔄 No destination, canceling drag");
      return;
    }
    
    // Same position, no change needed
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      console.log("🔄 Same position, no change");
      return;
    }

    // Get the filtered available Pokemon (excluding those already ranked) for display purposes
    const rankedPokemonIds = new Set(rankedPokemon.map(p => p.id));
    const filteredAvailablePokemon = availablePokemon.filter(p => !rankedPokemonIds.has(p.id));
    
    // Moving within the same list
    if (source.droppableId === destination.droppableId) {
      if (source.droppableId === "available") {
        // Reordering within available list - we don't update state since it's just visual
        console.log("🔄 Reordered within available list");
      } else if (source.droppableId === "ranked") {
        // Reordering within ranked list
        const newRankedItems = Array.from(rankedPokemon);
        const [movedItem] = newRankedItems.splice(source.index, 1);
        newRankedItems.splice(destination.index, 0, movedItem);
        
        console.log("🔄 Reordered within ranked list:", movedItem.name, "from", source.index, "to", destination.index);
        setRankedPokemon(newRankedItems);
      }
    } 
    // Moving from one list to another
    else {
      if (source.droppableId === "available" && destination.droppableId === "ranked") {
        // Moving from available to ranked
        const movedItem = filteredAvailablePokemon[source.index];
        
        if (!movedItem) {
          console.error("🔄 No item found at source index:", source.index);
          return;
        }
        
        console.log("🔄 Moving from available to ranked:", movedItem.name, "to position", destination.index);
        
        // Remove from available Pokemon state (from original array, not filtered)
        const newAvailablePokemon = availablePokemon.filter(p => p.id !== movedItem.id);
        
        // Add to ranked Pokemon state at the correct position
        const newRankedPokemon = Array.from(rankedPokemon);
        newRankedPokemon.splice(destination.index, 0, movedItem);
        
        console.log("🔄 New available count:", newAvailablePokemon.length);
        console.log("🔄 New ranked count:", newRankedPokemon.length);
        console.log("🔄 Ranked order:", newRankedPokemon.map(p => p.name));
        
        // Update both states
        setAvailablePokemon(newAvailablePokemon);
        setRankedPokemon(newRankedPokemon);
        
      } else if (source.droppableId === "ranked" && destination.droppableId === "available") {
        // Moving from ranked to available
        const movedItem = rankedPokemon[source.index];
        
        if (!movedItem) {
          console.error("🔄 No item found at ranked index:", source.index);
          return;
        }
        
        console.log("🔄 Moving from ranked to available:", movedItem.name);
        
        // Remove from ranked Pokemon state
        const newRankedPokemon = rankedPokemon.filter(p => p.id !== movedItem.id);
        
        // Add back to available Pokemon state (at the end, since order doesn't matter for available)
        const newAvailablePokemon = [...availablePokemon, movedItem];
        
        console.log("🔄 New ranked count:", newRankedPokemon.length);
        console.log("🔄 New available count:", newAvailablePokemon.length);
        
        // Update both states
        setRankedPokemon(newRankedPokemon);
        setAvailablePokemon(newAvailablePokemon);
      }
    }
  };

  return { handleDragEnd };
};
