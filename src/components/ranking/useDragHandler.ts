
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
    
    // Dropped outside of any droppable area
    if (!destination) return;
    
    // Check if the destination is the overlay area
    if (destination.droppableId === "ranked-overlay") {
      // When dropped on the overlay, add to the end of the ranked list
      const sourceItems = Array.from(availablePokemon);
      const destItems = Array.from(rankedPokemon);
      
      const [movedItem] = sourceItems.splice(source.index, 1);
      destItems.push(movedItem); // Add to the end
      
      setAvailablePokemon(sourceItems);
      setRankedPokemon(destItems);
      return;
    }
    
    // Moving within the same list
    if (source.droppableId === destination.droppableId) {
      if (source.droppableId === "available") {
        const newItems = Array.from(availablePokemon);
        const [movedItem] = newItems.splice(source.index, 1);
        newItems.splice(destination.index, 0, movedItem);
        setAvailablePokemon(newItems);
      } else if (source.droppableId === "ranked") {
        const newItems = Array.from(rankedPokemon);
        const [movedItem] = newItems.splice(source.index, 1);
        newItems.splice(destination.index, 0, movedItem);
        setRankedPokemon(newItems);
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
      } else if (source.droppableId === "ranked" && destination.droppableId === "available") {
        // Moving from ranked to available
        const sourceItems = Array.from(rankedPokemon);
        const destItems = Array.from(availablePokemon);
        
        const [movedItem] = sourceItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, movedItem);
        
        setRankedPokemon(sourceItems);
        setAvailablePokemon(destItems);
      }
    }
  };

  return { handleDragEnd };
};
