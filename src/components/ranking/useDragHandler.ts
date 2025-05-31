
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
    
    // Moving within the same list
    if (source.droppableId === destination.droppableId) {
      if (source.droppableId === "available") {
        const newItems = Array.from(availablePokemon);
        const [movedItem] = newItems.splice(source.index, 1);
        newItems.splice(destination.index, 0, movedItem);
        setAvailablePokemon(newItems);
        console.log("🔄 Reordered within available list");
      } else if (source.droppableId === "ranked") {
        const newItems = Array.from(rankedPokemon);
        const [movedItem] = newItems.splice(source.index, 1);
        newItems.splice(destination.index, 0, movedItem);
        setRankedPokemon(newItems);
        console.log("🔄 Reordered within ranked list");
      }
    } 
    // Moving from one list to another
    else {
      if (source.droppableId === "available" && destination.droppableId === "ranked") {
        // Moving from available to ranked
        const sourceItems = Array.from(availablePokemon);
        const destItems = Array.from(rankedPokemon);
        
        const [movedItem] = sourceItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, movedItem);
        
        setAvailablePokemon(sourceItems);
        setRankedPokemon(destItems);
        console.log("🔄 Moved from available to ranked:", movedItem.name);
      } else if (source.droppableId === "ranked" && destination.droppableId === "available") {
        // Moving from ranked to available
        const sourceItems = Array.from(rankedPokemon);
        const destItems = Array.from(availablePokemon);
        
        const [movedItem] = sourceItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, movedItem);
        
        setRankedPokemon(sourceItems);
        setAvailablePokemon(destItems);
        console.log("🔄 Moved from ranked to available:", movedItem.name);
      }
    }
  };

  return { handleDragEnd };
};
