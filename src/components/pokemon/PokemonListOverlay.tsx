
import React from "react";
import { Droppable } from "react-beautiful-dnd";

interface PokemonListOverlayProps {
  droppableId: string;
  isRankingArea: boolean;
}

const PokemonListOverlay: React.FC<PokemonListOverlayProps> = ({
  droppableId,
  isRankingArea
}) => {
  if (!isRankingArea) return null;

  return (
    <Droppable droppableId={`${droppableId}-overlay`}>
      {(provided, snapshot) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className={`absolute inset-0 z-0 ${snapshot.isDraggingOver ? 'bg-green-100/50' : ''}`}
          style={{ 
            display: snapshot.isDraggingOver ? 'block' : 'none',
            pointerEvents: snapshot.isDraggingOver ? 'auto' : 'none'
          }}
        >
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default PokemonListOverlay;
