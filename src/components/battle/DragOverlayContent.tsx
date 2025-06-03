
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import PokemonMilestoneImage from "@/components/pokemon/PokemonMilestoneImage";
import PokemonMilestoneInfo from "@/components/pokemon/PokemonMilestoneInfo";

interface DragOverlayContentProps {
  pokemon: Pokemon | RankedPokemon;
  context?: 'available' | 'ranked';
}

const DragOverlayContent: React.FC<DragOverlayContentProps> = ({ pokemon, context = 'ranked' }) => {
  const backgroundColorClass = getPokemonBackgroundColor(pokemon);
  
  console.log(`🎭 [DRAG_OVERLAY] Rendering overlay for ${pokemon.name}`);

  return (
    <div
      className={`${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col opacity-95 scale-105 shadow-2xl transform-gpu cursor-grabbing`}
      style={{
        minHeight: '140px',
        minWidth: '140px',
      }}
    >
      <PokemonMilestoneImage
        pokemon={pokemon}
        isDragging={true}
      />
      
      <PokemonMilestoneInfo
        pokemon={pokemon}
        isDragging={true}
        context={context}
      />
    </div>
  );
};

export default DragOverlayContent;
