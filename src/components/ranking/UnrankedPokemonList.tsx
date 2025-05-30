
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { useDraggable } from '@dnd-kit/core';
import { formatPokemonName } from "@/utils/pokemon";

interface UnrankedPokemonListProps {
  unrankedPokemon: Pokemon[];
}

const UnrankedPokemonCard: React.FC<{ pokemon: Pokemon }> = ({ pokemon }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: pokemon.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        p-3 border rounded-lg bg-white shadow-sm cursor-grab transition-all
        hover:shadow-md hover:border-blue-300
        ${isDragging ? 'opacity-50 cursor-grabbing' : ''}
      `}
    >
      <div className="flex items-center space-x-3">
        <img 
          src={pokemon.image} 
          alt={pokemon.name}
          className="w-12 h-12 object-contain"
        />
        <div>
          <h4 className="font-medium text-sm">{formatPokemonName(pokemon.name)}</h4>
          <p className="text-xs text-gray-500">#{pokemon.id}</p>
        </div>
      </div>
    </div>
  );
};

const UnrankedPokemonList: React.FC<UnrankedPokemonListProps> = ({
  unrankedPokemon
}) => {
  if (unrankedPokemon.length === 0) {
    return (
      <div className="min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-8">
        <p className="text-gray-500 text-center">
          All Pokemon have been ranked!
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
      {unrankedPokemon.map((pokemon) => (
        <UnrankedPokemonCard key={pokemon.id} pokemon={pokemon} />
      ))}
    </div>
  );
};

export default UnrankedPokemonList;
