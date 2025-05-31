
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

    // Get the filtered available Pokemon (excluding those already ranked)
    const rankedPokemonIds = new Set(rankedPokemon.map(p => p.id));
    const filteredAvailablePokemon = availablePokemon.filter(p => !rankedPokemonIds.has(p.id));
    
    // Moving within the same list
    if (source.droppableId === destination.droppableId) {
      if (source.droppableId === "available") {
        const newItems = Array.from(filteredAvailablePokemon);
        const [movedItem] = newItems.splice(source.index, 1);
        newItems.splice(destination.index, 0, movedItem);
        // We don't update the state here since it's just reordering within filtered list
        console.log("🔄 Reordered within available list:", movedItem.name);
      } else if (source.droppableId === "ranked") {
        const newItems = Array.from(rankedPokemon);
        const [movedItem] = newItems.splice(source.index, 1);
        newItems.splice(destination.index, 0, movedItem);
        setRankedPokemon(newItems);
        console.log("🔄 Reordered within ranked list:", movedItem.name);
      }
    } 
    // Moving from one list to another
    else {
      if (source.droppableId === "available" && destination.droppableId === "ranked") {
        // Moving from available to ranked
        const sourceItems = Array.from(filteredAvailablePokemon);
        const destItems = Array.from(rankedPokemon);
        
        const [movedItem] = sourceItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, movedItem);
        
        console.log("🔄 Moving from available to ranked:", movedItem.name);
        console.log("🔄 New ranked count:", destItems.length);
        
        // Only update ranked Pokemon - the filtering will handle removing from available display
        setRankedPokemon(destItems);
        
      } else if (source.droppableId === "ranked" && destination.droppableId === "available") {
        // Moving from ranked to available
        const sourceItems = Array.from(rankedPokemon);
        
        const [movedItem] = sourceItems.splice(source.index, 1);
        
        console.log("🔄 Moving from ranked to available:", movedItem.name);
        console.log("🔄 New ranked count:", sourceItems.length);
        
        // Only update ranked Pokemon - the filtering will handle adding to available display
        setRankedPokemon(sourceItems);
      }
    }
  };

  return { handleDragEnd };
};
